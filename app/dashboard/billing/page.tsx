import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CreditCard, Receipt, ArrowUpRight } from "lucide-react";
import { getSessionUser } from "@/lib/server/session";

export const metadata = { title: "Billing — Sokoni" };

const PLAN_LABELS: Record<string, { name: string; price: string; rate: number }> = {
  free: { name: "Free", price: "$0/mo", rate: 0 },
  pro: { name: "Pro SME", price: "$49/mo", rate: 49 },
  bulk: { name: "SME Bulk", price: "$149/mo", rate: 149 },
  forwarder: { name: "Forwarder", price: "$299/mo + per-cert", rate: 299 }
};

export default async function BillingPage() {
  const user = await getSessionUser();
  const plan = PLAN_LABELS[user.plan] ?? PLAN_LABELS.free;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Billing</h1>
        <p className="mt-1 text-sm text-ink-600">
          Manage your subscription, payment method, and invoices.
        </p>
      </header>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-500">Current plan</div>
            <div className="mt-1 font-display text-xl font-semibold">{plan.name}</div>
            <div className="text-sm text-ink-600">{plan.price}</div>
          </div>
          <Badge tone={user.plan === "free" ? "neutral" : "savanna"}>
            {user.plan === "free" ? "Free tier" : "Active"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button href="/pricing" variant="outline">
            <ArrowUpRight className="h-4 w-4" /> Compare plans
          </Button>
          <form action="/api/billing/portal" method="post">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium hover:bg-ink-50"
            >
              <CreditCard className="h-4 w-4" /> Open Stripe portal
            </button>
          </form>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-ink-500" />
            <span className="font-semibold">Payment method</span>
          </div>
          <p className="mt-2 text-sm text-ink-600">
            {user.plan === "free"
              ? "No payment method on file. Add one when you upgrade."
              : "Visa •••• 4242 — expires 12/29"}
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-block text-sm font-medium text-terracotta-700 hover:underline"
          >
            {user.plan === "free" ? "Add payment method →" : "Update →"}
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4 text-ink-500" />
            <span className="font-semibold">Invoices</span>
          </div>
          <p className="mt-2 text-sm text-ink-600">
            {user.plan === "free"
              ? "No invoices yet."
              : "Invoices arrive monthly by email and are also accessible in the Stripe portal."}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold">African payment methods</h2>
        <p className="mt-1 text-sm text-ink-600">
          We support Stripe (cards globally), Paystack (NG/GH/KE/ZA), and Flutterwave (mobile money +
          cards in 30+ African countries). Pick the rail that matches your account.
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
