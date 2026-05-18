import { NextResponse } from "next/server";

// Demo handler. Production wires to Resend (email confirmation),
// Vercel KV or Postgres (storage), and a Slack webhook for ops alerts.
// Set RESEND_API_KEY, WAITLIST_KV_URL, WAITLIST_SLACK_WEBHOOK as env vars.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const company = String(body?.company ?? "").trim().slice(0, 120);
    const country = String(body?.country ?? "").trim().slice(0, 80);
    const source = String(body?.source ?? "unknown").slice(0, 60);

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // In production: persist + email confirmation here.
    // await kv.lpush("sokoni:waitlist", JSON.stringify({ email, company, country, source, ts: Date.now() }));
    // await resend.emails.send({ to: email, ... });

    // Server-side log so it shows up in Vercel logs while we're still pre-DB.
    console.log("[waitlist]", { email, company, country, source });

    return NextResponse.json({
      ok: true,
      message:
        "Welcome aboard. We'll email when AfriOrigin opens for paid signups — early-access SMEs get 3 months free on Pro."
    });
  } catch (err) {
    return NextResponse.json({ error: "Could not process your request." }, { status: 500 });
  }
}
