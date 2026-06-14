import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import { listAgents, createAgent } from "@/lib/agents/store";
import { listAgentTemplates } from "@/lib/agents/catalogue";
import { countPendingApprovals } from "@/lib/agents/runs";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

// List the workspace's agents + the catalogue of templates it can add.
export async function GET() {
  const user = await getSessionUser();
  const [agents, pendingApprovals] = await Promise.all([
    listAgents(user.workspaceId),
    user.isDemo ? Promise.resolve(0) : countPendingApprovals(user.workspaceId)
  ]);
  return NextResponse.json({
    agents,
    templates: listAgentTemplates(),
    pendingApprovals,
    isDemo: user.isDemo
  });
}

const CreateBody = z.object({
  kind: z.string().min(1).max(60),
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(400).optional(),
  schedule: z.string().max(60).nullable().optional(),
  autoApproveThresholdUsd: z.number().nonnegative().nullable().optional()
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can create agents." }, { status: 403 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const agent = await createAgent({
    workspaceId: user.workspaceId,
    kind: parsed.data.kind,
    name: parsed.data.name,
    description: parsed.data.description,
    schedule: parsed.data.schedule ?? undefined,
    autoApproveThresholdUsd: parsed.data.autoApproveThresholdUsd ?? undefined,
    createdById: user.isDemo ? null : user.id
  });

  if (!agent) {
    return NextResponse.json({ error: "Unknown agent template." }, { status: 400 });
  }

  if (!user.isDemo) {
    const { ipAddress, userAgent } = ipAndUaFromRequest(req);
    audit({
      workspaceId: user.workspaceId,
      userId: user.id,
      action: "agent.created",
      target: agent.id,
      metadata: { kind: agent.kind, name: agent.name },
      ipAddress,
      userAgent
    });
  }

  return NextResponse.json({ ok: true, agent });
}
