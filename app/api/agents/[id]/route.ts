import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import { getAgent, updateAgent, deleteAgent } from "@/lib/agents/store";
import { listRuns } from "@/lib/agents/runs";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const agent = await getAgent(user.workspaceId, params.id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const runs = user.isDemo ? [] : await listRuns(user.workspaceId, { agentId: params.id, limit: 25 });
  return NextResponse.json({ agent, runs, isDemo: user.isDemo });
}

const PatchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(400).nullable().optional(),
  enabled: z.boolean().optional(),
  schedule: z.string().max(60).nullable().optional(),
  autoApproveThresholdUsd: z.number().nonnegative().nullable().optional(),
  maxSteps: z.number().int().min(1).max(60).optional(),
  maxTokens: z.number().int().min(1000).max(500_000).optional()
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can edit agents." }, { status: 403 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const agent = await updateAgent(user.workspaceId, params.id, parsed.data);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  if (!user.isDemo) {
    const { ipAddress, userAgent } = ipAndUaFromRequest(req);
    audit({
      workspaceId: user.workspaceId,
      userId: user.id,
      action: "agent.updated",
      target: agent.id,
      metadata: { ...parsed.data },
      ipAddress,
      userAgent
    });
  }
  return NextResponse.json({ ok: true, agent });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can delete agents." }, { status: 403 });
  }
  const ok = await deleteAgent(user.workspaceId, params.id);
  if (!ok) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  if (!user.isDemo) {
    const { ipAddress, userAgent } = ipAndUaFromRequest(req);
    audit({
      workspaceId: user.workspaceId,
      userId: user.id,
      action: "agent.deleted",
      target: params.id,
      ipAddress,
      userAgent
    });
  }
  return NextResponse.json({ ok: true });
}
