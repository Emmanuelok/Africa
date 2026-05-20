import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SubscriptionPanel } from "@/components/dashboard/SubscriptionPanel";

export const metadata = { title: "Billing — Sokoni" };

export default async function BillingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Billing</h1>
        <p className="mt-1 text-sm text-ink-600">
          Subscription, payment method, invoices, and plan limits.
        </p>
      </header>

      <SubscriptionPanel />

      <Card>
        <h2 className="font-semibold">African payment methods</h2>
        <p className="mt-1 text-sm text-ink-600">
          Stripe (cards globally), Paystack (NG/GH/KE/ZA), and Flutterwave (mobile money + cards
          across 30+ African countries). Pick the rail that matches your account.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge tone="neutral">Stripe</Badge>
          <Badge tone="neutral">Paystack</Badge>
          <Badge tone="neutral">Flutterwave</Badge>
          <Badge tone="neutral">M-Pesa</Badge>
          <Badge tone="neutral">MTN MoMo</Badge>
        </div>
      </Card>
    </div>
  );
}
