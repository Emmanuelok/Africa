import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb, schema } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/captcha/turnstile";
import { sendEmail } from "@/lib/email/resend";
import { waitlistConfirmationEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "waitlist");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429, headers });
  }

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const name = String(body?.name ?? "").trim().slice(0, 120) || null;
    const captchaToken = body?.captchaToken as string | null;

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400, headers });
    }
    if (password.length < 12) {
      return NextResponse.json({ error: "Password must be at least 12 characters." }, { status: 400, headers });
    }

    const captchaOk = await verifyTurnstile(captchaToken, ip);
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

    // Welcome email — non-blocking.
    const tpl = waitlistConfirmationEmail({ email });
    void sendEmail({ to: email, subject: "Welcome to Sokoni", html: tpl.html, text: tpl.text });

    return NextResponse.json({ ok: true, user: inserted[0] }, { headers });
  } catch (err) {
    console.error("[/api/auth/register]", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500, headers });
  }
}
