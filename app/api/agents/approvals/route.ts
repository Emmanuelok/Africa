import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { listPendingApprovals } from "@/lib/agents/runs";

export const runtime = "nodejs";

// All approvals across the workspace awaiting a human decision.
export async function GET() {
  const user = await getSessionUser();
  if (user.isDemo) return NextResponse.json({ approvals: [], isDemo: true });
  const rows = await listPendingApprovals(user.workspaceId);
  return NextResponse.json({
    approvals: rows.map((a) => ({
      id: a.id,
      runId: a.runId,
      question: a.question,
      payload: a.payload,
      toolName: a.toolName,
      createdAt: a.createdAt.toISOString()
    }))
  });
}
