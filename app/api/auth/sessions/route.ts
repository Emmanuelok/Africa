import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq, desc, gt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { createHash } from "crypto";

export const runtime = "nodejs";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token"
];

function currentSessionToken(): string | null {
  for (const n of SESSION_COOKIE_NAMES) {
    const v = cookies().get(n)?.value;
    if (v) return v;
  }
  return null;
}

function maskToken(t: string): string {
  return `…${t.slice(-6)}`;
}

function tokenFingerprint(t: string): string {
  return createHash("sha256").update(t).digest("hex").slice(0, 16);
}

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) {
    return NextResponse.json({
      sessions: [
        { id: "demo-session", current: true, expires: new Date(Date.now() + 7 * 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(), fingerprint: "demo000000000000", masked: "…demo01" }
      ]
    });
  }

  const rows = await db
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.userId, user.id), gt(schema.sessions.expires, new Date())))
    .orderBy(desc(schema.sessions.expires));

  const current = currentSessionToken();
  return NextResponse.json({
    sessions: rows.map((r) => ({
      id: r.sessionToken,
      current: !!current && r.sessionToken === current,
      expires: r.expires.toISOString(),
      createdAt: r.expires.toISOString(), // Auth.js doesn't store created_at separately
      fingerprint: tokenFingerprint(r.sessionToken),
      masked: maskToken(r.sessionToken)
    }))
  });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) return NextResponse.json({ ok: true, isDemo: true });

  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;
  const all = Boolean(body?.all);
  const current = currentSessionToken();

  if (all) {
    // Revoke everything except the caller's own session — they stay signed in.
    const all = await db
      .select({ sessionToken: schema.sessions.sessionToken })
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, user.id));
    for (const s of all) {
      if (s.sessionToken !== current) {
        await db.delete(schema.sessions).where(eq(schema.sessions.sessionToken, s.sessionToken));
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (!id) return NextResponse.json({ error: "id or all:true required" }, { status: 400 });
  if (id === current) {
    return NextResponse.json({ error: "Sign out instead of revoking your current session." }, { status: 400 });
  }
  await db.delete(schema.sessions).where(and(
    eq(schema.sessions.userId, user.id),
    eq(schema.sessions.sessionToken, id)
  ));
  return NextResponse.json({ ok: true });
}
