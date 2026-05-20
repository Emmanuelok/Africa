import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { getStripe } from "@/lib/billing/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";

export type SubscriptionSummary = {
  plan: "free" | "pro" | "bulk" | "forwarder";
  status: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid" | "paused" | "none";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  paymentMethod: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  invoicesUrl: string | null;
  source: "stripe" | "demo" | "free";
};

const DEMO: SubscriptionSummary = {
  plan: "pro",
  status: "active",
  currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18).toISOString(),
  cancelAtPeriodEnd: false,
  trialEnd: null,
  amount: 4900,
  currency: "usd",
  interval: "month",
  paymentMethod: { brand: "visa", last4: "4242", expMonth: 12, expYear: 2029 },
  invoicesUrl: null,
  source: "demo"
};

export async function GET() {
  const user = await getSessionUser();

  if (user.isDemo) return NextResponse.json(DEMO);

  const db = getDb();
  if (!db) return NextResponse.json({ ...DEMO, source: "demo" });

  const [ws] = await db
    .select()
    .from(schema.workspaces)
    .where(eq(schema.workspaces.id, user.workspaceId))
    .limit(1);
  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  // Free plan or no Stripe subscription — nothing to fetch.
  if (!ws.stripeSubscriptionId) {
    return NextResponse.json<SubscriptionSummary>({
      plan: (ws.plan as SubscriptionSummary["plan"]) ?? "free",
      status: "none",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
      amount: null,
      currency: null,
      interval: null,
      paymentMethod: null,
      invoicesUrl: null,
      source: "free"
    });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ ...DEMO, plan: ws.plan as SubscriptionSummary["plan"] });

  try {
    const sub = await stripe.subscriptions.retrieve(ws.stripeSubscriptionId, {
      expand: ["default_payment_method", "items.data.price"]
    });
    const item = sub.items.data[0];
    const price = item?.price;
    const pm = sub.default_payment_method as Stripe.PaymentMethod | null;
    // current_period_end moved to subscription items in newer Stripe APIs; read either path.
    const subAny = sub as unknown as { current_period_end?: number; trial_end?: number | null };
    const itemAny = item as unknown as { current_period_end?: number };
    const periodEnd = itemAny?.current_period_end ?? subAny.current_period_end ?? null;

    return NextResponse.json<SubscriptionSummary>({
      plan: (ws.plan as SubscriptionSummary["plan"]) ?? "free",
      status: sub.status as SubscriptionSummary["status"],
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      trialEnd: subAny.trial_end ? new Date(subAny.trial_end * 1000).toISOString() : null,
      amount: price?.unit_amount ?? null,
      currency: price?.currency ?? null,
      interval: price?.recurring?.interval ?? null,
      paymentMethod: pm?.card
        ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year
          }
        : null,
      invoicesUrl: ws.stripeCustomerId ? `https://dashboard.stripe.com/customers/${ws.stripeCustomerId}` : null,
      source: "stripe"
    });
  } catch (err) {
    console.warn("[billing] stripe retrieve failed:", err);
    return NextResponse.json({ error: "Could not fetch subscription details" }, { status: 502 });
  }
}
