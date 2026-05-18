import { NextResponse } from "next/server";
import { getStripe, PRICE_IDS } from "@/lib/billing/stripe";

export const runtime = "nodejs";

const PLAN_TO_PRICE = {
  pro: PRICE_IDS.pro,
  bulk: PRICE_IDS.bulk,
  forwarder: PRICE_IDS.forwarder
} as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan = String(body?.plan ?? "") as keyof typeof PLAN_TO_PRICE;
    const email = String(body?.email ?? "").trim().toLowerCase();

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Billing not yet enabled. Join the waitlist at /signup to be notified.", redirect: "/signup" },
        { status: 503 }
      );
    }

    const price = PLAN_TO_PRICE[plan];
    if (!price) {
      return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    }

    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: email || undefined,
      success_url: `${origin}/dashboard?subscribed={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: { plan }
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[/api/checkout]", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
