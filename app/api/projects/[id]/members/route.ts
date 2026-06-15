import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import { getMembership, setMemberRole, removeMember } from "@/lib/data/projects";

export const runtime = "nodejs";

const PatchBody = z.object({
  userId: z.string().min(1),
  role: z.enum(["owner", "editor", "viewer"])
});

// Change a member's role. Owner only.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const role = await getMembership(params.id, user.id);
  if (role !== "owner") return NextResponse.json({ error: "Only the owner can change roles." }, { status: 403 });

  const json = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await setMemberRole(params.id, parsed.data.userId, parsed.data.role);
  return NextResponse.json({ ok: true });
}

const DeleteBody = z.object({ userId: z.string().min(1) });

// Remove a member, or leave the project yourself.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const role = await getMembership(params.id, user.id);
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const json = await req.json().catch(() => ({}));
  const parsed = DeleteBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const target = parsed.data.userId;
  // Members can remove themselves (leave); only owners can remove others.
  if (target !== user.id && role !== "owner") {
    return NextResponse.json({ error: "Only the owner can remove other members." }, { status: 403 });
  }
  await removeMember(params.id, target);
  return NextResponse.json({ ok: true });
}
