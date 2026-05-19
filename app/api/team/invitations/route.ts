import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { sendEmail } from "@/lib/email/resend";
import { teamInviteEmail } from "@/lib/email/templates";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

export async function POST(req: Request) {
  const user = await getSessionUser();
  const db = getDb();

  if (!db || user.isDemo) {
    return NextResponse.json(
      { ok: true, isDemo: true, message: "Invitations require a configured database in production." },
      { status: user.isDemo ? 200 : 503 }
    );
  }

  const body = await req.json();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = body?.role === "admin" ? "admin" : "member";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const rows = await db
    .insert(schema.workspaceInvitations)
    .values({
      workspaceId: user.workspaceId,
      email,
      role,
      invitedById: user.id,
      token,
      expiresAt
    })
    .returning({ id: schema.workspaceInvitations.id });

  const acceptUrl = `${SITE}/accept-invite?token=${token}`;
  const tpl = teamInviteEmail({
    inviterName: user.name ?? user.email,
    workspaceName: user.workspaceName,
    acceptUrl
  });
  void sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "workspace.member_invited",
    target: rows[0].id,
    metadata: { email, role },
    ipAddress,
    userAgent
  });

  return NextResponse.json({ ok: true, id: rows[0].id, acceptUrl });
}

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) {
    return NextResponse.json({
      invitations: [
        { id: "inv_demo_1", email: "ada@nairobi-roasters.coop", role: "admin", createdAt: "2026-05-18T09:00:00Z", expiresAt: "2026-05-25T09:00:00Z", acceptedAt: null }
      ]
    });
  }
  const rows = await db
    .select()
    .from(schema.workspaceInvitations)
    .where(and(
      eq(schema.workspaceInvitations.workspaceId, user.workspaceId),
      isNull(schema.workspaceInvitations.revokedAt)
    ))
    .orderBy(desc(schema.workspaceInvitations.createdAt));
  return NextResponse.json({
    invitations: rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
      acceptedAt: r.acceptedAt?.toISOString() ?? null
    }))
  });
}
