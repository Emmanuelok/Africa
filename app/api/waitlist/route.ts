import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db/client";
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
    return NextResponse.json(
      { error: "Too many waitlist requests from this address. Try again in a few minutes." },
      { status: 429, headers }
    );
  }

  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const company = String(body?.company ?? "").trim().slice(0, 120) || null;
    const country = String(body?.country ?? "").trim().slice(0, 80) || null;
    const source = String(body?.source ?? "unknown").slice(0, 60);
    const captchaToken = body?.captchaToken as string | null;

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400, headers });
    }

    const captchaOk = await verifyTurnstile(captchaToken, ip);
    if (!captchaOk) {
      return NextResponse.json({ error: "Captcha verification failed. Refresh and try again." }, { status: 400, headers });
    }

    const db = getDb();
    if (db) {
      try {
        await db
          .insert(schema.waitlist)
          .values({ email, company, country, source })
          .onConflictDoNothing();
      } catch (err) {
        console.error("[waitlist] db insert failed:", err);
      }
    }

    console.log("[waitlist]", { email, company, country, source, persisted: !!db });

    // Confirmation email — fire and forget.
    const tpl = waitlistConfirmationEmail({ email });
    void sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });

    // Slack notification.
    const slack = process.env.WAITLIST_SLACK_WEBHOOK;
    if (slack) {
      void fetch(slack, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `:wave: New waitlist signup: *${email}* (${company ?? "no company"}, ${country ?? "no country"}) via ${source}`
        })
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          "Welcome aboard. We just sent you a confirmation — early-access SMEs get 3 months free on Pro when billing opens."
      },
      { headers }
    );
  } catch (err) {
    console.error("[/api/waitlist]", err);
    return NextResponse.json({ error: "Could not process your request." }, { status: 500, headers });
  }
}
