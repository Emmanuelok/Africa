import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { getRun, listSteps } from "@/lib/agents/runs";

export const runtime = "nodejs";

// Run detail with its full step trace. Polled by the run viewer.
export async function GET(_req: Request, { params }: { params: { runId: string } }) {
  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json({ run: null, steps: [], isDemo: true });
  }
  const run = await getRun(user.workspaceId, params.runId);
  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  const steps = await listSteps(params.runId);
  return NextResponse.json({
    run: {
      id: run.id,
      agentId: run.agentId,
      status: run.status,
      triggeredBy: run.triggeredBy,
      goal: run.goal,
      summary: run.summary,
      error: run.error,
      stepCount: run.stepCount,
      inputTokens: run.inputTokens,
      outputTokens: run.outputTokens,
      startedAt: run.startedAt?.toISOString() ?? null,
      finishedAt: run.finishedAt?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString()
    },
    steps: steps.map((s) => ({
      id: s.id,
      idx: s.idx,
      kind: s.kind,
      name: s.name,
      input: s.input,
      output: s.output,
      durationMs: s.durationMs,
      error: s.error,
      createdAt: s.createdAt.toISOString()
    }))
  });
}
