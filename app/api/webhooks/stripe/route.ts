import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { getDb } from "@/lib/db/client";
import type Stripe from "stripe";

export const runtime = "nodejs";

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
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getDb();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const plan = (session.metadata?.plan as string) ?? "pro";
      const customerId = session.customer as string | null;
      const subscriptionId = session.subscription as string | null;

      if (db && customerId) {
        // In real implementation, upsert workspace + subscription mapping.
        console.log("[stripe] checkout completed:", { customerId, subscriptionId, plan });
      } else {
        console.log("[stripe] checkout completed (no DB):", { customerId, plan });
      }
      break;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      console.log("[stripe] subscription event:", event.type, sub.id, sub.status);
      // Update workspace plan in DB based on subscription status.
      break;
    }
    default:
      // Other events ignored for now.
      break;
  }

  return NextResponse.json({ received: true });
}
