import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/billing/stripe";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(new URL("/pricing?portal=unavailable", req.url), 303);
  }

  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.redirect(new URL("/signup?portal=demo", req.url), 303);
  }

  const db = getDb();
  if (!db) {
    return NextResponse.redirect(new URL("/pricing?portal=no_db", req.url), 303);
  }

  // Load the workspace's Stripe customer.
  const rows = await db
    .select()
    .from(schema.workspaces)
    .where(eq(schema.workspaces.id, user.workspaceId))
    .limit(1);
  const ws = rows[0];

  let customerId = ws?.stripeCustomerId ?? null;

  // Lazily create one if missing — keeps onboarding simple.
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.workspaceName,
      metadata: { workspaceId: user.workspaceId }
    });
    customerId = customer.id;
    await db
      .update(schema.workspaces)
      .set({ stripeCustomerId: customerId })
      .where(eq(schema.workspaces.id, user.workspaceId));
  }

  const origin = new URL(req.url).origin;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard/billing`
  });

  return NextResponse.redirect(session.url, 303);
}
