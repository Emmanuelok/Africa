// The agent engine: a resumable Anthropic tool-use loop.
//
// A run is started with a goal. The engine loads the agent's template (system
// prompt + allowed tools), then drives a conversation with Claude, executing
// tool calls against the Sokoni tool registry and persisting every step so the
// dashboard can render a live trace.
//
// Human-in-the-loop: when the model calls `request_approval` (or invokes a
// destructive tool), the engine creates an approval record, persists the
// in-flight conversation to agent_runs.state, sets the run to
// `awaiting_approval`, and returns. A later call to `resumeRun()` — triggered
// when a human approves/declines — rehydrates the state and continues exactly
// where it stopped.
//
// Safety rails: maxSteps caps LLM round-trips; maxTokens caps total token
// spend. Both come from the agent row and are enforced engine-side.

import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropic, ANTHROPIC_MODEL } from "@/lib/ai/anthropic";
import { getAgentTemplate } from "@/lib/agents/catalogue";
import { TOOLS, toolsForAgent, type AgentContext, type ToolDefinition } from "@/lib/agents/tools";
import { getDb, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { log } from "@/lib/log";
import {
  appendStep,
  createApproval,
  loadRun,
  updateRun,
  type AgentRunRow
} from "@/lib/agents/runs";

type MessageParam = Anthropic.Messages.MessageParam;
type ContentBlock = Anthropic.Messages.ContentBlockParam;
type ToolResultBlock = Anthropic.Messages.ToolResultBlockParam;

// Persisted resume state. We keep the committed message array plus, when paused
// mid-turn, the assistant content and the partial tool-results computed before
// the approval interrupted us.
type RunState = {
  messages: MessageParam[];
  stepIdx: number;
  pending?: {
    assistantContent: ContentBlock[];
    toolResults: ToolResultBlock[];
    approval: { toolUseId: string; approvalId: string; mode: "ask" | "gated_tool"; toolName?: string; input?: unknown };
  };
};

function buildAnthropicTools(defs: ToolDefinition[]): Anthropic.Messages.Tool[] {
  return defs.map((d, i) => ({
    name: d.name,
    description: d.description,
    input_schema: d.inputSchema as Anthropic.Messages.Tool.InputSchema,
    // Cache the (stable) tool definitions on the last entry.
    ...(i === defs.length - 1 ? { cache_control: { type: "ephemeral" as const } } : {})
  }));
}

function toolResultText(result: unknown): string {
  try {
    return JSON.stringify(result);
  } catch {
    return String(result);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Kick off (or resume) execution of an already-created run row. Returns the
// terminal status. Safe to call from a route handler — it awaits the loop.
export async function executeRun(runId: string): Promise<string> {
  const run = await loadRun(runId);
  if (!run) {
    log.warn({ runId }, "executeRun: run not found");
    return "failed";
  }
  if (run.status === "succeeded" || run.status === "failed" || run.status === "cancelled") {
    return run.status;
  }
  return drive(run, null);
}

// Resume a paused run after a human decision on an approval.
export async function resumeRun(
  runId: string,
  approvalId: string,
  decision: "approve" | "decline",
  note?: string | null
): Promise<string> {
  const run = await loadRun(runId);
  if (!run) return "failed";
  if (run.status !== "awaiting_approval") {
    // Idempotent: nothing to resume.
    return run.status;
  }
  return drive(run, { approvalId, decision, note: note ?? null });
}

// ---------------------------------------------------------------------------
// Core loop
// ---------------------------------------------------------------------------
async function drive(
  run: AgentRunRow,
  resume: { approvalId: string; decision: "approve" | "decline"; note: string | null } | null
): Promise<string> {
  const client = getAnthropic();
  const db = getDb();

  // Load the agent + template.
  let kind: string | null = null;
  let name = "Agent";
  let maxSteps = 20;
  let maxTokens = 50_000;
  let autoApproveThresholdUsd: number | null = null;
  if (db) {
    const rows = await db.select().from(schema.agents).where(eq(schema.agents.id, run.agentId)).limit(1);
    const a = rows[0];
    if (a) {
      kind = a.kind;
      name = a.name;
      maxSteps = a.maxSteps ?? 20;
      maxTokens = a.maxTokens ?? 50_000;
      autoApproveThresholdUsd = a.autoApproveThreshold != null ? Number(a.autoApproveThreshold) : null;
    }
  }
  const template = kind ? getAgentTemplate(kind) : null;
  if (!template) {
    await updateRun(run.id, { status: "failed", error: "Unknown agent template", finishedAt: new Date() });
    return "failed";
  }

  if (!client) {
    await updateRun(run.id, {
      status: "failed",
      error: "ANTHROPIC_API_KEY is not configured — the agent engine needs a model to run.",
      finishedAt: new Date()
    });
    return "failed";
  }

  const ctx: AgentContext = {
    agentId: run.agentId,
    agentName: name,
    workspaceId: run.workspaceId,
    autoApproveThresholdUsd
  };

  const defs = toolsForAgent(template.tools);
  const anthropicTools = buildAnthropicTools(defs);

  // Rehydrate or initialise state.
  const state: RunState =
    (run.state as RunState | null) ?? {
      messages: [{ role: "user", content: run.goal ?? "Begin." }],
      stepIdx: 0
    };

  let inputTokens = run.inputTokens ?? 0;
  let outputTokens = run.outputTokens ?? 0;
  let stepIdx = state.stepIdx;
  let llmRoundTrips = 0;

  await updateRun(run.id, { status: "running", startedAt: run.startedAt ?? new Date(), state });

  // If we're resuming from an approval, finish the interrupted turn first.
  if (resume && state.pending) {
    const p = state.pending;
    // The approval row is resolved by the caller (the resume route, which has
    // the deciding user). Here we just record the resolution as a trace step
    // and feed the decision back into the conversation.
    await appendStep({
      runId: run.id,
      idx: stepIdx++,
      kind: "approval_resolved",
      name: p.approval.toolName ?? "request_approval",
      output: { decision: resume.decision, note: resume.note }
    });

    let approvalResult: ToolResultBlock;
    if (p.approval.mode === "ask") {
      approvalResult = {
        type: "tool_result",
        tool_use_id: p.approval.toolUseId,
        content: toolResultText({
          approved: resume.decision === "approve",
          note: resume.note ?? undefined
        })
      };
    } else {
      // gated_tool: execute the real tool now if approved, else return decline.
      if (resume.decision === "approve" && p.approval.toolName) {
        const def = TOOLS[p.approval.toolName];
        const start = Date.now();
        try {
          const res = await def.handler(p.approval.input, ctx);
          await appendStep({
            runId: run.id,
            idx: stepIdx++,
            kind: "tool_result",
            name: def.name,
            output: res,
            durationMs: Date.now() - start
          });
          approvalResult = {
            type: "tool_result",
            tool_use_id: p.approval.toolUseId,
            content: toolResultText(res),
            ...(res.ok ? {} : { is_error: true })
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          approvalResult = { type: "tool_result", tool_use_id: p.approval.toolUseId, content: msg, is_error: true };
        }
      } else {
        approvalResult = {
          type: "tool_result",
          tool_use_id: p.approval.toolUseId,
          content: toolResultText({ ok: false, error: `Declined by reviewer${resume.note ? `: ${resume.note}` : ""}` }),
          is_error: true
        };
      }
    }

    // Commit the assistant turn + the full tool-results (partial + approval).
    state.messages.push({ role: "assistant", content: p.assistantContent });
    state.messages.push({ role: "user", content: [...p.toolResults, approvalResult] });
    delete state.pending;
  }

  // Main loop.
  try {
    while (true) {
      if (llmRoundTrips >= maxSteps) {
        await finish(run.id, "failed", null, `Reached max step limit (${maxSteps}).`, stepIdx, inputTokens, outputTokens);
        return "failed";
      }
      if (inputTokens + outputTokens >= maxTokens) {
        await finish(run.id, "failed", null, `Reached max token budget (${maxTokens}).`, stepIdx, inputTokens, outputTokens);
        return "failed";
      }

      llmRoundTrips++;
      const resp = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        system: [{ type: "text", text: template.systemPrompt, cache_control: { type: "ephemeral" } }],
        tools: anthropicTools,
        messages: state.messages
      });

      inputTokens += resp.usage.input_tokens + (resp.usage.cache_read_input_tokens ?? 0);
      outputTokens += resp.usage.output_tokens;

      // Persist any assistant text blocks.
      for (const block of resp.content) {
        if (block.type === "text" && block.text.trim()) {
          await appendStep({
            runId: run.id,
            idx: stepIdx++,
            kind: "llm_text",
            output: { text: block.text.slice(0, 4000) }
          });
        }
      }

      if (resp.stop_reason !== "tool_use") {
        // Terminal: the model is done.
        const summary =
          resp.content
            .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
            .map((b) => b.text)
            .join("\n")
            .trim()
            .slice(0, 2000) || "Run completed.";
        await finish(run.id, "succeeded", summary, null, stepIdx, inputTokens, outputTokens);
        return "succeeded";
      }

      // Process tool_use blocks in order.
      const toolUses = resp.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
      );
      const toolResults: ToolResultBlock[] = [];

      for (const tu of toolUses) {
        const def = TOOLS[tu.name];

        // 1) Explicit approval request → pause.
        if (tu.name === "request_approval") {
          const inp = (tu.input ?? {}) as { question?: string; payload?: Record<string, unknown> };
          const stepRef = await appendStep({
            runId: run.id,
            idx: stepIdx++,
            kind: "approval_request",
            name: "request_approval",
            input: inp
          });
          const appr = await createApproval({
            runId: run.id,
            stepId: stepRef.id,
            workspaceId: run.workspaceId,
            question: inp.question ?? "Approve to continue?",
            payload: inp.payload ?? null,
            toolName: "request_approval"
          });
          await pause(run.id, {
            messages: state.messages,
            stepIdx,
            pending: {
              assistantContent: resp.content as ContentBlock[],
              toolResults,
              approval: { toolUseId: tu.id, approvalId: appr.id, mode: "ask" }
            }
          });
          notifyApproval(run.workspaceId, name, inp.question ?? "Approve to continue?");
          return "awaiting_approval";
        }

        // 2) Unknown tool — feed an error back so the model can recover.
        if (!def) {
          await appendStep({
            runId: run.id,
            idx: stepIdx++,
            kind: "tool_result",
            name: tu.name,
            error: "unknown tool",
            output: { ok: false, error: `Unknown tool: ${tu.name}` }
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: toolResultText({ ok: false, error: `Unknown tool: ${tu.name}` }),
            is_error: true
          });
          continue;
        }

        // 3) Destructive tool → gate behind approval (engine-side safety net).
        if (def.sensitivity === "destructive") {
          const stepRef = await appendStep({
            runId: run.id,
            idx: stepIdx++,
            kind: "approval_request",
            name: def.name,
            input: tu.input
          });
          const appr = await createApproval({
            runId: run.id,
            stepId: stepRef.id,
            workspaceId: run.workspaceId,
            question: `Approve "${def.name}"? This action is destructive.`,
            payload: (tu.input ?? {}) as Record<string, unknown>,
            toolName: def.name
          });
          await pause(run.id, {
            messages: state.messages,
            stepIdx,
            pending: {
              assistantContent: resp.content as ContentBlock[],
              toolResults,
              approval: { toolUseId: tu.id, approvalId: appr.id, mode: "gated_tool", toolName: def.name, input: tu.input }
            }
          });
          notifyApproval(run.workspaceId, name, `Approve "${def.name}"?`);
          return "awaiting_approval";
        }

        // 4) Normal tool — record the call, execute, record the result.
        await appendStep({ runId: run.id, idx: stepIdx++, kind: "tool_call", name: def.name, input: tu.input });
        const start = Date.now();
        let result: { ok: boolean; output?: unknown; error?: string };
        try {
          result = await def.handler(tu.input, ctx);
        } catch (err) {
          result = { ok: false, error: err instanceof Error ? err.message : String(err) };
        }
        await appendStep({
          runId: run.id,
          idx: stepIdx++,
          kind: "tool_result",
          name: def.name,
          output: result,
          durationMs: Date.now() - start,
          error: result.ok ? null : result.error ?? "tool error"
        });
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: toolResultText(result),
          ...(result.ok ? {} : { is_error: true })
        });
      }

      // Commit the full turn and loop again.
      state.messages.push({ role: "assistant", content: resp.content as ContentBlock[] });
      state.messages.push({ role: "user", content: toolResults });
      state.stepIdx = stepIdx;
      await updateRun(run.id, { state, stepCount: stepIdx, inputTokens, outputTokens });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.warn({ runId: run.id, err: msg }, "agent run failed");
    await finish(run.id, "failed", null, msg.slice(0, 500), stepIdx, inputTokens, outputTokens);
    return "failed";
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function pause(runId: string, state: RunState) {
  await updateRun(runId, { status: "awaiting_approval", state, stepCount: state.stepIdx });
}

async function finish(
  runId: string,
  status: "succeeded" | "failed",
  summary: string | null,
  error: string | null,
  stepCount: number,
  inputTokens: number,
  outputTokens: number
) {
  await updateRun(runId, {
    status,
    summary,
    error,
    stepCount,
    inputTokens,
    outputTokens,
    state: null,
    finishedAt: new Date()
  });
}

function notifyApproval(workspaceId: string, agentName: string, question: string) {
  // Lazy import to avoid a cycle; fire-and-forget.
  void import("@/lib/server/notify").then(({ notify }) => {
    notify({
      workspaceId,
      kind: "system.update",
      title: `${agentName} needs your approval`,
      body: question,
      target: "/dashboard/agents"
    });
  });
}
