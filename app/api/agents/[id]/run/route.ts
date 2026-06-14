import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import { getAgent, markAgentRan } from "@/lib/agents/store";
import { createRun, getRun, listSteps } from "@/lib/agents/runs";
import { executeRun } from "@/lib/agents/engine";
import { checkQuota } from "@/lib/server/quota";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  goal: z.string().min(1).max(4000).optional()
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "api");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers });
  }

  const user = await getSessionUser();
  const agent = await getAgent(user.workspaceId, params.id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404, headers });
  if (!agent.enabled) {
    return NextResponse.json({ error: "This agent is paused. Enable it before running." }, { status: 409, headers });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400, headers });
  }

  // Demo mode can't execute a real model loop without a workspace/db — return a
  // friendly signal the UI renders as "sign in to run".
  if (user.isDemo) {
    return NextResponse.json(
      {
        ok: false,
        demo: true,
        message: "Agent runs execute against your live workspace. Sign in and connect a database to run agents."
      },
      { status: 200, headers }
    );
  }

  // Manual runs count toward the determination quota envelope so autonomous
  // agents can't silently blow past a plan's limits.
  const q = await checkQuota(user.workspaceId, user.plan, "determinationsPerMonth");
  if (!q.ok) {
    return NextResponse.json(
      { error: q.reason, used: q.used, limit: q.limit, code: "quota_exceeded" },
      { status: 402, headers }
    );
  }

  const goal = parsed.data.goal ?? defaultGoal(agent.kind);
  const run = await createRun({
    agentId: agent.id,
    workspaceId: user.workspaceId,
    goal,
    triggeredBy: "manual",
    triggeredById: user.id
  });

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "agent.run_started",
    target: run.id,
    metadata: { agentId: agent.id, kind: agent.kind, trigger: "manual" },
    ipAddress,
    userAgent
  });
  void markAgentRan(agent.id, agent.schedule);

  // Execute synchronously (manual runs are short and the UI shows a live
  // trace). The loop returns when the run completes or pauses for approval.
  const status = await executeRun(run.id);

  const [detail, steps] = await Promise.all([getRun(user.workspaceId, run.id), listSteps(run.id)]);
  return NextResponse.json({ ok: true, runId: run.id, status, run: detail, steps }, { headers });
}

function defaultGoal(kind: string): string {
  switch (kind) {
    case "tariff_watchdog":
      return "Review the workspace's recent determinations and flag anything that needs attention.";
    case "weekly_recap":
      return "Summarise this week's AfCFTA activity for the team.";
    case "compliance_sentry":
      return "Review the most recently issued certificate for compliance risk.";
    default:
      return "Begin.";
  }
}
