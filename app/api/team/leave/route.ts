import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/server/workspace";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { logFor } from "@/lib/log";

export const runtime = "nodejs";

// POST /api/team/leave — the current user removes themselves from the active
// workspace. A sole owner can't leave (they'd orphan the workspace) — they
// must transfer ownership or delete the workspace first.
export async function POST(req: Request) {
  const logger = logFor(req, { route: "/api/team/leave" });
  const user = await getSessionUser();
  if (user.isDemo) return NextResponse.json({ ok: true, isDemo: true });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const memberships = await db
    .select()
    .from(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.userId, user.id)))
    .limit(1);
  if (memberships.length === 0) {
    return NextResponse.json({ error: "You're not a member of this workspace." }, { status: 404 });
  }

  // Block the last owner from leaving.
  if (memberships[0].role === "owner") {
    const owners = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.workspaceMembers)
      .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.role, "owner")));
    if ((owners[0]?.c ?? 0) <= 1) {
      return NextResponse.json(
        { error: "You're the only owner. Transfer ownership or delete the workspace before leaving.", code: "sole_owner" },
        { status: 409 }
      );
    }
  }

  await db
    .delete(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.userId, user.id)));

  // Clear the active-workspace cookie so the next request re-resolves to one
  // of their remaining workspaces (or demo if none).
  if (cookies().get(ACTIVE_WORKSPACE_COOKIE)?.value === user.workspaceId) {
    cookies().delete(ACTIVE_WORKSPACE_COOKIE);
  }

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "workspace.member_removed",
    target: user.id,
    metadata: { event: "left_workspace" },
    ipAddress,
    userAgent
  });
  logger.info({ workspaceId: user.workspaceId, userId: user.id }, "member left workspace");

  return NextResponse.json({ ok: true });
}
