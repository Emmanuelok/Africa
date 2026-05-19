import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/billing/stripe";
import { getDb, schema } from "@/lib/db/client";
import { dispatch } from "@/lib/webhooks/dispatch";
import { notify } from "@/lib/server/notify";
import { audit } from "@/lib/server/audit";
import type Stripe from "stripe";

export const runtime = "nodejs";

const STRIPE_PRICE_TO_PLAN: Record<string, "pro" | "bulk" | "forwarder"> = {};
if (process.env.STRIPE_PRICE_PRO_SME) STRIPE_PRICE_TO_PLAN[process.env.STRIPE_PRICE_PRO_SME] = "pro";
if (process.env.STRIPE_PRICE_SME_BULK) STRIPE_PRICE_TO_PLAN[process.env.STRIPE_PRICE_SME_BULK] = "bulk";
if (process.env.STRIPE_PRICE_FORWARDER) STRIPE_PRICE_TO_PLAN[process.env.STRIPE_PRICE_FORWARDER] = "forwarder";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string | null;
      const subscriptionId = session.subscription as string | null;
      const metaPlan = (session.metadata?.plan as "pro" | "bulk" | "forwarder" | undefined) ?? "pro";
      console.log("[stripe] checkout completed:", { customerId, subscriptionId, plan: metaPlan });

      if (db && customerId) {
        const wsRows = await db
          .select()
          .from(schema.workspaces)
          .where(eq(schema.workspaces.stripeCustomerId, customerId))
          .limit(1);
        const ws = wsRows[0];
        if (ws) {
          await db
            .update(schema.workspaces)
            .set({ plan: metaPlan, stripeSubscriptionId: subscriptionId ?? null })
            .where(eq(schema.workspaces.id, ws.id));

          void dispatch({
            workspaceId: ws.id,
            event: "workspace.upgraded",
            object: { id: ws.id, plan: metaPlan, stripe_subscription_id: subscriptionId }
          });
          notify({
            workspaceId: ws.id,
            kind: "billing.upgraded",
            title: `Subscription active — ${metaPlan.toUpperCase()} plan`,
            body: `Welcome to Sokoni ${metaPlan}. New plan limits are live across your workspace.`,
            target: "/dashboard/billing"
          });
          audit({
            workspaceId: ws.id,
            action: "billing.subscribed",
            actor: "stripe",
            target: subscriptionId ?? null,
            metadata: { plan: metaPlan, customerId }
          });
        }
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const priceId = sub.items.data[0]?.price?.id;
      const isCancelled =
        event.type === "customer.subscription.deleted" ||
        sub.status === "canceled" ||
        sub.cancel_at_period_end === true;
      const newPlan = isCancelled ? "free" : priceId ? STRIPE_PRICE_TO_PLAN[priceId] ?? "pro" : "pro";

      console.log("[stripe] subscription event:", event.type, sub.id, sub.status, "→", newPlan);

      if (db) {
        const wsRows = await db
          .select()
          .from(schema.workspaces)
          .where(eq(schema.workspaces.stripeCustomerId, customerId))
          .limit(1);
        const ws = wsRows[0];
        if (ws && ws.plan !== newPlan) {
          await db
            .update(schema.workspaces)
            .set({ plan: newPlan })
            .where(eq(schema.workspaces.id, ws.id));

          const eventKind = newPlan === "free" ? "workspace.downgraded" : "workspace.upgraded";
          void dispatch({
            workspaceId: ws.id,
            event: eventKind,
            object: { id: ws.id, plan: newPlan, previous_plan: ws.plan }
          });
          notify({
            workspaceId: ws.id,
            kind: "billing.upgraded",
            title:
              newPlan === "free"
                ? "Subscription canceled — moved to Free tier"
                : `Plan changed to ${newPlan.toUpperCase()}`,
            body:
              newPlan === "free"
                ? "We'll stop billing you at the end of the current period. Reach out to sales@sokoni.africa if this was unintended."
                : `Plan limits and features are now those of the ${newPlan} tier.`,
            target: "/dashboard/billing"
          });
          audit({
            workspaceId: ws.id,
            action: newPlan === "free" ? "billing.canceled" : "billing.subscribed",
            actor: "stripe",
            target: sub.id,
            metadata: { previousPlan: ws.plan, newPlan }
          });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id ?? null;
      console.log("[stripe] invoice payment failed:", inv.id, customerId);
      if (db && customerId) {
        const wsRows = await db
          .select()
          .from(schema.workspaces)
          .where(eq(schema.workspaces.stripeCustomerId, customerId))
          .limit(1);
        const ws = wsRows[0];
        if (ws) {
          notify({
            workspaceId: ws.id,
            kind: "billing.payment_failed",
            title: "Payment failed",
            body: "We couldn't process the most recent invoice. Update your payment method in /dashboard/billing.",
            target: "/dashboard/billing"
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
