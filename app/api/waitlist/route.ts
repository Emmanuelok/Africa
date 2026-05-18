import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const company = String(body?.company ?? "").trim().slice(0, 120) || null;
    const country = String(body?.country ?? "").trim().slice(0, 80) || null;
    const source = String(body?.source ?? "unknown").slice(0, 60);

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    // Persist if we have a DB.
    const db = getDb();
    if (db) {
      try {
        await db.insert(schema.waitlist).values({ email, company, country, source }).onConflictDoNothing();
      } catch (err) {
        console.error("[waitlist] db insert failed:", err);
      }
    }

    // Always log so it shows up in Vercel logs.
    console.log("[waitlist]", { email, company, country, source, persisted: !!db });

    // Slack notification (optional).
    const slack = process.env.WAITLIST_SLACK_WEBHOOK;
    if (slack) {
      try {
        await fetch(slack, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `:wave: New waitlist signup: *${email}* (${company ?? "no company"}, ${country ?? "no country"}) via ${source}`
          })
        });
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      message:
        "Welcome aboard. We'll email when AfriOrigin opens for paid signups — early-access SMEs get 3 months free on Pro."
    });
  } catch (err) {
    return NextResponse.json({ error: "Could not process your request." }, { status: 500 });
  }
}
