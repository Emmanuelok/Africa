import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import { listProjectsForUser, createProject } from "@/lib/data/projects";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  const projects = await listProjectsForUser(user.id, user.isDemo);
  return NextResponse.json({ projects, isDemo: user.isDemo });
}

const CreateBody = z.object({
  kind: z.enum(["trade", "study"]),
  name: z.string().min(1).max(140),
  topic: z.string().max(160).optional(),
  description: z.string().max(2000).optional(),
  visibility: z.enum(["private", "link"]).optional()
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  const json = await req.json().catch(() => ({}));
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const project = await createProject({
    workspaceId: user.workspaceId,
    kind: parsed.data.kind,
    name: parsed.data.name,
    topic: parsed.data.topic,
    description: parsed.data.description,
    visibility: parsed.data.visibility,
    user: { id: user.id, name: user.name, email: user.email, organization: user.workspaceName }
  });
  return NextResponse.json({ ok: true, project });
}
