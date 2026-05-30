import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { issueToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/resend";
import { passwordResetEmail } from "@/lib/email/templates";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/captcha/turnstile";

export const runtime = "nodejs";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

const Body = z.object({
  email: z.string().email().max(320),
  captchaToken: z.string().nullable().optional()
});

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "waitlist"); // 3 / 10min — same low budget as registration
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429, headers });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400, headers });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const captchaOk = await verifyTurnstile(parsed.data.captchaToken ?? null, ip);
  if (!captchaOk) {
    return NextResponse.json({ error: "Captcha verification failed." }, { status: 400, headers });
  }

  // Deliberately respond identically whether the email exists or not, to
  // avoid leaking which addresses have accounts. Token issuance + send is
  // skipped silently when the user doesn't exist.
  const ok = NextResponse.json(
    { ok: true, message: "If that address has an account, a reset link is on the way." },
    { headers }
  );

  const db = getDb();
  if (!db) return ok;

  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const user = rows[0];
  if (!user) return ok;

  const token = await issueToken("password-reset", email);
  if (!token) return ok;

  const url = `${SITE}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const tpl = passwordResetEmail({ url, email });
  void sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });

  return ok;
}
