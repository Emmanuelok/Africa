import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { logFor } from "@/lib/log";

export const runtime = "nodejs";

const PatchBody = z.object({ role: z.enum(["owner", "admin", "member"]) });

// PATCH — change a member's role. Owners only. Cannot demote yourself if you'd
// leave the workspace with no owner.
export async function PATCH(req: Request, { params }: { params: { userId: string } }) {
  const logger = logFor(req, { route: "/api/team/members/[userId]" });
  const user = await getSessionUser();
  if (user.isDemo) return NextResponse.json({ ok: true, isDemo: true });
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Only an owner can change member roles." }, { status: 403 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const json = await req.json().catch(() => ({}));
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const target = await db
    .select()
    .from(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.userId, params.userId)))
    .limit(1);
  if (target.length === 0) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  // Guard against removing the last owner.
  if (target[0].role === "owner" && parsed.data.role !== "owner") {
    const owners = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.workspaceMembers)
      .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.role, "owner")));
    if ((owners[0]?.c ?? 0) <= 1) {
      return NextResponse.json({ error: "A workspace must keep at least one owner." }, { status: 409 });
    }
  }

  await db
    .update(schema.workspaceMembers)
    .set({ role: parsed.data.role })
    .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.userId, params.userId)));

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "workspace.member_invited",
    target: params.userId,
    metadata: { event: "role_changed", newRole: parsed.data.role },
    ipAddress,
    userAgent
  });
  logger.info({ workspaceId: user.workspaceId, targetUser: params.userId, newRole: parsed.data.role }, "member role changed");

  return NextResponse.json({ ok: true });
}

// DELETE — remove a member from the workspace. Owner/admin only. Can't remove
// the last owner; admins can't remove owners.
export async function DELETE(req: Request, { params }: { params: { userId: string } }) {
  const logger = logFor(req, { route: "/api/team/members/[userId]" });
  const user = await getSessionUser();
  if (user.isDemo) return NextResponse.json({ ok: true, isDemo: true });
  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "Only an owner or admin can remove members." }, { status: 403 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const target = await db
    .select()
    .from(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.userId, params.userId)))
    .limit(1);
  if (target.length === 0) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  if (target[0].role === "owner") {
    if (user.role !== "owner") {
      return NextResponse.json({ error: "Admins can't remove an owner." }, { status: 403 });
    }
    const owners = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.workspaceMembers)
      .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.role, "owner")));
    if ((owners[0]?.c ?? 0) <= 1) {
      return NextResponse.json({ error: "Can't remove the last owner. Transfer ownership first." }, { status: 409 });
    }
  }

  await db
    .delete(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.userId, params.userId)));

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "workspace.member_removed",
    target: params.userId,
    metadata: { removedRole: target[0].role },
    ipAddress,
    userAgent
  });
  logger.info({ workspaceId: user.workspaceId, targetUser: params.userId }, "member removed");

  return NextResponse.json({ ok: true });
}
