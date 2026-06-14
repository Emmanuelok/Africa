// Persistence helpers for agent runs, steps, and approvals. The engine
// (lib/agents/engine.ts) drives execution; this module owns the database
// reads/writes so the engine stays focused on the LLM loop.
//
// Every function degrades gracefully when DATABASE_URL is unset: writes become
// no-ops returning synthetic ids, reads return empty/null. That keeps the agent
// dashboard demoable without a database.

import { and, desc, eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getDb, schema } from "@/lib/db/client";
import { log } from "@/lib/log";

export type RunStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "succeeded"
  | "failed"
  | "cancelled";

export type StepKind =
  | "llm_text"
  | "tool_call"
  | "tool_result"
  | "approval_request"
  | "approval_resolved";

function synthId(prefix: string) {
  return `${prefix}_demo_${randomBytes(6).toString("hex")}`;
}

// ----------------------------------------------------------------------------
// Runs
// ----------------------------------------------------------------------------
export type CreateRunInput = {
  agentId: string;
  workspaceId: string;
  goal: string | null;
  triggeredBy: "manual" | "cron" | "webhook" | "api";
  triggeredById?: string | null;
  triggerPayload?: Record<string, unknown> | null;
};

export async function createRun(input: CreateRunInput): Promise<{ id: string }> {
  const db = getDb();
  if (!db) return { id: synthId("run") };
  const rows = await db
    .insert(schema.agentRuns)
    .values({
      agentId: input.agentId,
      workspaceId: input.workspaceId,
      goal: input.goal,
      triggeredBy: input.triggeredBy,
      triggeredById: input.triggeredById ?? null,
      triggerPayload: input.triggerPayload ?? null,
      status: "queued"
    })
    .returning({ id: schema.agentRuns.id });
  return { id: rows[0].id };
}

export type RunPatch = {
  status?: RunStatus;
  summary?: string | null;
  error?: string | null;
  stepCount?: number;
  inputTokens?: number;
  outputTokens?: number;
  state?: Record<string, unknown> | null;
  startedAt?: Date;
  finishedAt?: Date | null;
};

export async function updateRun(runId: string, patch: RunPatch): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.update(schema.agentRuns).set(patch).where(eq(schema.agentRuns.id, runId));
}

export type AgentRunRow = typeof schema.agentRuns.$inferSelect;

export async function getRun(workspaceId: string, runId: string): Promise<AgentRunRow | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.agentRuns).where(eq(schema.agentRuns.id, runId)).limit(1);
  const r = rows[0];
  if (!r || r.workspaceId !== workspaceId) return null;
  return r;
}

// Internal: load a run without a workspace guard (used by the engine, which
// already trusts its caller).
export async function loadRun(runId: string): Promise<AgentRunRow | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.agentRuns).where(eq(schema.agentRuns.id, runId)).limit(1);
  return rows[0] ?? null;
}

export async function listRuns(workspaceId: string, opts?: { agentId?: string; limit?: number }) {
  const db = getDb();
  if (!db) return [];
  const conds = [eq(schema.agentRuns.workspaceId, workspaceId)];
  if (opts?.agentId) conds.push(eq(schema.agentRuns.agentId, opts.agentId));
  return db
    .select({
      id: schema.agentRuns.id,
      agentId: schema.agentRuns.agentId,
      status: schema.agentRuns.status,
      triggeredBy: schema.agentRuns.triggeredBy,
      goal: schema.agentRuns.goal,
      summary: schema.agentRuns.summary,
      error: schema.agentRuns.error,
      stepCount: schema.agentRuns.stepCount,
      inputTokens: schema.agentRuns.inputTokens,
      outputTokens: schema.agentRuns.outputTokens,
      startedAt: schema.agentRuns.startedAt,
      finishedAt: schema.agentRuns.finishedAt,
      createdAt: schema.agentRuns.createdAt
    })
    .from(schema.agentRuns)
    .where(and(...conds))
    .orderBy(desc(schema.agentRuns.createdAt))
    .limit(opts?.limit ?? 25);
}

// ----------------------------------------------------------------------------
// Steps
// ----------------------------------------------------------------------------
export type AppendStepInput = {
  runId: string;
  idx: number;
  kind: StepKind;
  name?: string | null;
  input?: unknown;
  output?: unknown;
  durationMs?: number | null;
  error?: string | null;
};

export async function appendStep(input: AppendStepInput): Promise<{ id: string }> {
  const db = getDb();
  if (!db) return { id: synthId("step") };
  const rows = await db
    .insert(schema.agentSteps)
    .values({
      runId: input.runId,
      idx: input.idx,
      kind: input.kind,
      name: input.name ?? null,
      input: (input.input ?? null) as never,
      output: (input.output ?? null) as never,
      durationMs: input.durationMs ?? null,
      error: input.error ?? null
    })
    .returning({ id: schema.agentSteps.id });
  return { id: rows[0].id };
}

export async function listSteps(runId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(schema.agentSteps)
    .where(eq(schema.agentSteps.runId, runId))
    .orderBy(schema.agentSteps.idx);
}

// ----------------------------------------------------------------------------
// Approvals
// ----------------------------------------------------------------------------
export type CreateApprovalInput = {
  runId: string;
  stepId: string;
  workspaceId: string;
  question: string;
  payload?: Record<string, unknown> | null;
  toolName?: string | null;
};

export async function createApproval(input: CreateApprovalInput): Promise<{ id: string }> {
  const db = getDb();
  if (!db) return { id: synthId("appr") };
  const rows = await db
    .insert(schema.agentApprovals)
    .values({
      runId: input.runId,
      stepId: input.stepId,
      workspaceId: input.workspaceId,
      question: input.question,
      payload: (input.payload ?? null) as never,
      toolName: input.toolName ?? null
    })
    .returning({ id: schema.agentApprovals.id });
  return { id: rows[0].id };
}

export type AgentApprovalRow = typeof schema.agentApprovals.$inferSelect;

export async function getApproval(workspaceId: string, approvalId: string): Promise<AgentApprovalRow | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db.select().from(schema.agentApprovals).where(eq(schema.agentApprovals.id, approvalId)).limit(1);
  const r = rows[0];
  if (!r || r.workspaceId !== workspaceId) return null;
  return r;
}

export async function resolveApproval(
  approvalId: string,
  decision: "approve" | "decline",
  decidedById: string | null,
  note?: string | null
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(schema.agentApprovals)
    .set({ decision, decidedById, decidedAt: new Date(), note: note ?? null })
    .where(eq(schema.agentApprovals.id, approvalId));
}

// Pending approvals across the workspace — surfaced as cards in the UI.
export async function listPendingApprovals(workspaceId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(schema.agentApprovals)
    .where(and(eq(schema.agentApprovals.workspaceId, workspaceId), sql`${schema.agentApprovals.decidedAt} is null`))
    .orderBy(desc(schema.agentApprovals.createdAt))
    .limit(50);
}

export async function countPendingApprovals(workspaceId: string): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.agentApprovals)
    .where(and(eq(schema.agentApprovals.workspaceId, workspaceId), sql`${schema.agentApprovals.decidedAt} is null`));
  return rows[0]?.n ?? 0;
}

export function logRunError(runId: string, err: unknown) {
  log.warn({ runId, err: err instanceof Error ? err.message : String(err) }, "agent run error");
}
