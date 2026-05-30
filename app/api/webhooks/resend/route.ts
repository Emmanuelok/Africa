import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

// Resend's webhook signature uses Svix. The header carries one or more
// `v1,base64(hmac)` entries; we verify against RESEND_WEBHOOK_SECRET.
// https://resend.com/docs/dashboard/webhooks/verify-webhook-requests
function verifySvix(secret: string, headers: Headers, raw: string): boolean {
  const id = headers.get("svix-id") ?? headers.get("webhook-id");
  const timestamp = headers.get("svix-timestamp") ?? headers.get("webhook-timestamp");
  const signature = headers.get("svix-signature") ?? headers.get("webhook-signature");
  if (!id || !timestamp || !signature) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signed = `${id}.${timestamp}.${raw}`;
  const expected = createHmac("sha256", secretBytes).update(signed).digest("base64");

  return signature
    .split(" ")
    .map((s) => s.split(",")[1])
    .filter(Boolean)
    .some((sig) => {
      try {
        return timingSafeEqual(Buffer.from(sig, "base64"), Buffer.from(expected, "base64"));
      } catch {
        return false;
      }
    });
}

// Reasons we suppress an address. Anything else is logged but ignored — we
// don't blacklist for transient soft failures.
const SUPPRESS_TYPES: Record<string, string> = {
  "email.bounced": "bounce",
  "email.complained": "complaint",
  "email.delivery_delayed": "soft_delay" // logged only, not suppressed
};

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  if (!verifySvix(secret, req.headers, raw)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Malformed body" }, { status: 400 });
  }

  const db = getDb();
  const data = event.data ?? {};
  // Resend events: `to` is the recipient(s); `bounce` carries a `type` of
  // "Permanent" | "Transient" | "Undetermined".
  const recipients = (Array.isArray((data as { to?: unknown }).to) ? (data as { to: string[] }).to : [String((data as { to?: string }).to ?? "")])
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  console.log("[resend:webhook]", event.type, recipients);

  const reason = SUPPRESS_TYPES[event.type];
  if (db && reason && reason !== "soft_delay" && recipients.length > 0) {
    const bounceType = ((data as { bounce?: { type?: string } }).bounce?.type ?? "").toLowerCase();
    const finalReason = event.type === "email.bounced" && bounceType === "transient" ? "soft_bounce" : reason;

    // Don't suppress on transient bounces — those are usually mailbox full
    // or temporary DNS issues and the sender should retry.
    if (finalReason !== "soft_bounce") {
      try {
        await db
          .insert(schema.suppressedEmails)
          .values(
            recipients.map((email) => ({
              email,
              reason: finalReason,
              detail:
                (data as { bounce?: { message?: string } }).bounce?.message?.slice(0, 500) ??
                (event.type === "email.complained" ? "Marked as spam" : null)
            }))
          )
          .onConflictDoNothing();
      } catch (err) {
        console.warn("[resend:webhook] insert failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
