import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getStripe, PRICE_IDS } from "@/lib/billing/stripe";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { getSessionUser } from "@/lib/server/session";
import { getDb, schema } from "@/lib/db/client";
import { logFor } from "@/lib/log";

export const runtime = "nodejs";

const PLAN_TO_PRICE = {
  pro: PRICE_IDS.pro,
  bulk: PRICE_IDS.bulk,
  forwarder: PRICE_IDS.forwarder
} as const;

// Stripe Tax is opt-in via env so it doesn't break test-mode accounts that
// haven't completed the Tax registration setup in their dashboard.
const TAX_ENABLED = process.env.STRIPE_TAX_ENABLED === "true";

export async function POST(req: Request) {
  const logger = logFor(req, { route: "/api/checkout" });
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "checkout");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many checkout attempts. Slow down." }, { status: 429, headers });
  }

  try {
    const body = await req.json();
    const plan = String(body?.plan ?? "") as keyof typeof PLAN_TO_PRICE;

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Billing not yet enabled. Join the waitlist at /signup to be notified.", redirect: "/signup" },
        { status: 503, headers }
      );
    }

    const price = PLAN_TO_PRICE[plan];
    if (!price) {
      return NextResponse.json({ error: "Unknown plan" }, { status: 400, headers });
    }

    const user = await getSessionUser();
    const email = (String(body?.email ?? "").trim().toLowerCase() || user.email) || undefined;

    // Reuse the workspace's existing Stripe customer when present so a buyer
    // doesn't end up with duplicate customer records (and tax IDs / addresses
    // carry over). Falls back to customer_email for fresh signups.
    let customerId: string | undefined;
    const db = getDb();
    if (db && !user.isDemo) {
      const wsRows = await db
        .select({ stripeCustomerId: schema.workspaces.stripeCustomerId })
        .from(schema.workspaces)
        .where(eq(schema.workspaces.id, user.workspaceId))
        .limit(1);
      customerId = wsRows[0]?.stripeCustomerId ?? undefined;
    }

    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer: customerId,
      customer_email: customerId ? undefined : email,
      client_reference_id: user.isDemo ? undefined : user.workspaceId,
      success_url: `${origin}/dashboard/billing?subscribed={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
      billing_address_collection: TAX_ENABLED ? "required" : "auto",
      // Collect a business tax ID (VAT, etc.) so reverse-charge applies for
      // EU B2B and the invoice is compliant.
      tax_id_collection: TAX_ENABLED ? { enabled: true } : undefined,
      automatic_tax: TAX_ENABLED ? { enabled: true } : undefined,
      // When customer is reused, Stripe needs address update permission for
      // automatic tax to recompute.
      customer_update: customerId && TAX_ENABLED ? { address: "auto", name: "auto" } : undefined,
      subscription_data: {
        metadata: { plan, workspaceId: user.isDemo ? "" : user.workspaceId }
      },
      metadata: { plan, workspaceId: user.isDemo ? "" : user.workspaceId }
    });

    logger.info({ plan, workspaceId: user.isDemo ? null : user.workspaceId, taxEnabled: TAX_ENABLED }, "checkout session created");
    return NextResponse.json({ url: session.url }, { headers });
  } catch (err) {
    logger.error({ err }, "checkout failed");
    return NextResponse.json({ error: "Checkout failed" }, { status: 500, headers });
  }
}
