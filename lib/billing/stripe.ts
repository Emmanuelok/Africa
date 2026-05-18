import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client = new Stripe(key);
  return client;
}

export const PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO_SME,
  bulk: process.env.STRIPE_PRICE_SME_BULK,
  forwarder: process.env.STRIPE_PRICE_FORWARDER
} as const;

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}
