import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { getDb, schema } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/captcha/turnstile";
import { sendEmail } from "@/lib/email/resend";
import { emailVerificationEmail } from "@/lib/email/templates";
import { issueToken } from "@/lib/auth/tokens";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { seedDefaultPreferences } from "@/lib/server/notify";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

const Body = z.object({
  email: z.string().email().max(320),
  password: z.string().min(12, "Password must be at least 12 characters").max(256),
  name: z.string().max(120).optional().nullable(),
  captchaToken: z.string().nullable().optional()
});

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "waitlist");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429, headers });
  }

  try {
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400, headers });
    }
    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;
    const name = parsed.data.name?.trim().slice(0, 120) || null;

    const captchaOk = await verifyTurnstile(parsed.data.captchaToken ?? null, ip);
    if (!captchaOk) {
      return NextResponse.json({ error: "Captcha verification failed." }, { status: 400, headers });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Account creation is temporarily unavailable. Please use the waitlist.", redirect: "/signup" },
        { status: 503, headers }
      );
    }

    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409, headers });
    }

    const passwordHash = await hashPassword(password);
    const inserted = await db
      .insert(schema.users)
      .values({ email, name, passwordHash })
      .returning({ id: schema.users.id, email: schema.users.email });

    // Seed default notification preferences for the new user.
    void seedDefaultPreferences(inserted[0].id);

    // Issue email verification token + send the email — non-blocking.
    void (async () => {
      const token = await issueToken("email-verify", email);
      if (!token) return;
      const url = `${SITE}/api/auth/verify?email=${encodeURIComponent(email)}&token=${token}`;
      const tpl = emailVerificationEmail({ url, email });
      await sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    })();

    const { ipAddress, userAgent } = ipAndUaFromRequest(req);
    audit({
      userId: inserted[0].id,
      action: "user.registered",
      actor: email,
      metadata: { email },
      ipAddress,
      userAgent
    });

    return NextResponse.json({ ok: true, user: inserted[0], emailVerificationSent: true }, { headers });
  } catch (err) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500, headers });
  }
}
