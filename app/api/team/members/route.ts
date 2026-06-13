import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

const DEMO_MEMBERS = [
  { userId: "demo-user", name: "Amara Okonkwo", email: "demo@sokoni.africa", role: "owner", joinedAt: "2026-04-22T10:58:00Z", isSelf: true },
  { userId: "u2", name: "Kwame Mensah", email: "kwame@highlandscoffee.coop", role: "admin", joinedAt: "2026-04-25T09:00:00Z", isSelf: false },
  { userId: "u3", name: "Nadia Hassan", email: "nadia@highlandscoffee.coop", role: "member", joinedAt: "2026-05-02T14:00:00Z", isSelf: false }
];

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) {
    return NextResponse.json({ members: DEMO_MEMBERS, viewerRole: "owner" });
  }

  const rows = await db
    .select({
      userId: schema.workspaceMembers.userId,
      role: schema.workspaceMembers.role,
      joinedAt: schema.workspaceMembers.joinedAt,
      name: schema.users.name,
      email: schema.users.email
    })
    .from(schema.workspaceMembers)
    .innerJoin(schema.users, eq(schema.workspaceMembers.userId, schema.users.id))
    .where(eq(schema.workspaceMembers.workspaceId, user.workspaceId));

  return NextResponse.json({
    members: rows.map((r) => ({
      userId: r.userId,
      name: r.name ?? r.email,
      email: r.email,
      role: r.role,
      joinedAt: r.joinedAt.toISOString(),
      isSelf: r.userId === user.id
    })),
    viewerRole: user.role
  });
}
