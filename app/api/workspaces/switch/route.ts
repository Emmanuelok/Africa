import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  const body = await req.json();
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Demo: allow switching across demo workspaces purely client-side.
  if (user.isDemo) {
    cookies().set(ACTIVE_WORKSPACE_COOKIE, id, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
    return NextResponse.json({ ok: true, isDemo: true });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ ok: true, persisted: false });

  // Verify membership before honoring.
  const rows = await db
    .select({ id: schema.workspaceMembers.workspaceId })
    .from(schema.workspaceMembers)
    .where(and(
      eq(schema.workspaceMembers.userId, user.id),
      eq(schema.workspaceMembers.workspaceId, id)
    ))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not a member of that workspace" }, { status: 403 });
  }

  cookies().set(ACTIVE_WORKSPACE_COOKIE, id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });

  return NextResponse.json({ ok: true });
}
