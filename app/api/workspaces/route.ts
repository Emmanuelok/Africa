import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/server/workspace";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json(
      { error: "Workspace creation requires a real account. Sign up at /register." },
      { status: 403 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Workspace creation requires a configured database." },
      { status: 503 }
    );
  }

  const body = await req.json();
  const name = String(body?.name ?? "").trim().slice(0, 120);
  const country = body?.country ? String(body.country).toUpperCase().slice(0, 2) : null;

  if (name.length < 2) {
    return NextResponse.json({ error: "name must be at least 2 characters" }, { status: 400 });
  }

  const created = await db
    .insert(schema.workspaces)
    .values({ name, country, plan: "free" })
    .returning({ id: schema.workspaces.id, name: schema.workspaces.name });

  await db.insert(schema.workspaceMembers).values({
    workspaceId: created[0].id,
    userId: user.id,
    role: "owner"
  });

  // Switch to the new workspace immediately.
  cookies().set(ACTIVE_WORKSPACE_COOKIE, created[0].id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: created[0].id,
    userId: user.id,
    action: "workspace.member_invited", // closest existing; treat creation as "owner joined"
    target: created[0].id,
    metadata: { event: "workspace_created", name },
    ipAddress,
    userAgent
  });

  return NextResponse.json({ ok: true, id: created[0].id, name: created[0].name });
}
