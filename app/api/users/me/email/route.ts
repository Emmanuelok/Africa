import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { verifyPassword } from "@/lib/auth/password";
import { issueToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/resend";
import { emailVerificationEmail } from "@/lib/email/templates";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

const Body = z.object({
  newEmail: z.string().email().max(320),
  password: z.string().min(1)
});

// POST /api/users/me/email — request a change. We send the verification link
// to the NEW address and only swap the user's email once they click it. Until
// then the old address remains the login.
export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "waitlist");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
  }

  const user = await getSessionUser();
  if (user.isDemo) return NextResponse.json({ error: "Demo accounts can't change email." }, { status: 403, headers });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503, headers });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400, headers });
  }

  const newEmail = parsed.data.newEmail.trim().toLowerCase();
  if (newEmail === user.email.toLowerCase()) {
    return NextResponse.json({ error: "That's already your email." }, { status: 400, headers });
  }

  // Re-auth.
  const rows = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  const u = rows[0];
  if (!u?.passwordHash) return NextResponse.json({ error: "Account not found" }, { status: 404, headers });
  if (!(await verifyPassword(parsed.data.password, u.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401, headers });
  }

  // Conflict check.
  const taken = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, newEmail)).limit(1);
  if (taken.length > 0) {
    // Don't leak account existence — respond as if we sent the email anyway.
    return NextResponse.json({ ok: true, message: "Confirmation link sent to the new address." }, { headers });
  }

  // Use a "change:OLD>NEW" identifier so the consume call knows both sides.
  const identifier = `email-change:${user.email.toLowerCase()}>${newEmail}`;
  const token = await issueToken("email-verify", identifier);
  if (!token) return NextResponse.json({ error: "Could not issue token" }, { status: 500, headers });

  const url = `${SITE}/api/users/me/email/confirm?token=${token}&from=${encodeURIComponent(user.email)}&to=${encodeURIComponent(newEmail)}`;
  const tpl = emailVerificationEmail({ url, email: newEmail });
  void sendEmail({ to: newEmail, subject: "Confirm your new Sokoni email", html: tpl.html, text: tpl.text });

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    userId: user.id,
    action: "user.password_changed",
    actor: user.email,
    metadata: { event: "email_change_requested", newEmail },
    ipAddress,
    userAgent
  });

  return NextResponse.json({ ok: true, message: "Confirmation link sent to the new address." }, { headers });
}
