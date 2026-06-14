import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import { getApproval, resolveApproval, getRun, listSteps } from "@/lib/agents/runs";
import { resumeRun } from "@/lib/agents/engine";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  decision: z.enum(["approve", "decline"]),
  note: z.string().max(1000).optional()
});

// Resolve a pending approval and resume the paused run.
export async function POST(req: Request, { params }: { params: { approvalId: string } }) {
  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json({ ok: false, demo: true, message: "Approvals act on live runs. Sign in to resolve." });
  }
  if (user.role !== "owner" && user.role !== "admin" && user.role !== "member") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const approval = await getApproval(user.workspaceId, params.approvalId);
  if (!approval) return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  if (approval.decidedAt) {
    return NextResponse.json({ error: "This approval was already resolved." }, { status: 409 });
  }

  // Resolve the approval row (records who decided), then resume the run.
  await resolveApproval(params.approvalId, parsed.data.decision, user.id, parsed.data.note);

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "agent.approval_resolved",
    target: approval.runId,
    metadata: { approvalId: approval.id, decision: parsed.data.decision, toolName: approval.toolName },
    ipAddress,
    userAgent
  });

  const status = await resumeRun(approval.runId, params.approvalId, parsed.data.decision, parsed.data.note);

  const [run, steps] = await Promise.all([getRun(user.workspaceId, approval.runId), listSteps(approval.runId)]);
  return NextResponse.json({ ok: true, status, run, steps });
}
