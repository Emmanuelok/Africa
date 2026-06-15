import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import {
  getProjectForUser,
  listMembers,
  listEvents,
  listInvites,
  updateProject
} from "@/lib/data/projects";

export const runtime = "nodejs";

// Full room payload: project, the viewer's role, members, feed, and (for
// managers) the active invite links.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const access = await getProjectForUser(params.id, user.id, user.isDemo);
  if (!access) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const canManage = access.role === "owner";
  const [members, events, invites] = await Promise.all([
    listMembers(params.id, user.id),
    listEvents(params.id, user.id, { limit: 100 }),
    canManage ? listInvites(params.id) : Promise.resolve([])
  ]);

  return NextResponse.json({
    project: access.project,
    role: access.role,
    canManage,
    members,
    events,
    invites,
    viewer: { id: user.id, name: user.name ?? user.email, isDemo: user.isDemo }
  });
}

const PatchBody = z.object({
  name: z.string().min(1).max(140).optional(),
  topic: z.string().max(160).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  visibility: z.enum(["private", "link"]).optional(),
  archived: z.boolean().optional()
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const access = await getProjectForUser(params.id, user.id, user.isDemo);
  if (!access) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (access.role !== "owner") {
    return NextResponse.json({ error: "Only the project owner can edit it." }, { status: 403 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  await updateProject(params.id, parsed.data);
  return NextResponse.json({ ok: true });
}
