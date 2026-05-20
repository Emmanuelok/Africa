"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Receipt,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Loader2
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Sub = {
  plan: "free" | "pro" | "bulk" | "forwarder";
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  paymentMethod: { brand: string; last4: string; expMonth: number; expYear: number } | null;
  invoicesUrl: string | null;
  source: string;
};

const PLAN_LABELS = {
  free: { name: "Free", limits: { certificatesPerMonth: 0, members: 2, bulkRows: 5 } },
  pro: { name: "Pro SME", limits: { certificatesPerMonth: 5, members: 2, bulkRows: 50 } },
  bulk: { name: "SME Bulk", limits: { certificatesPerMonth: 25, members: 5, bulkRows: 500 } },
  forwarder: { name: "Forwarder", limits: { certificatesPerMonth: Infinity, members: Infinity, bulkRows: 2000 } }
} as const;

export function SubscriptionPanel() {
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/billing/subscription");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not load subscription");
        setSub(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load subscription");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading subscription…
        </div>
      </Card>
    );
  }

  if (error || !sub) {
    return (
      <Card>
        <div className="flex items-start gap-2 text-sm text-terracotta-700">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error ?? "Could not load subscription"}</span>
        </div>
      </Card>
    );
  }

  const plan = PLAN_LABELS[sub.plan];
  const isActive = sub.status === "active" || sub.status === "trialing";
  const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  const daysUntilRenewal = periodEnd ? Math.max(0, Math.round((periodEnd.getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-500">Current plan</div>
            <div className="mt-1 font-display text-2xl font-semibold">{plan.name}</div>
            {sub.amount !== null && (
              <div className="text-sm text-ink-600">
                {formatPrice(sub.amount, sub.currency ?? "usd")} /{sub.interval ?? "month"}
              </div>
            )}
            {sub.source === "demo" && (
              <Badge tone="warn" className="mt-2">Demo data</Badge>
            )}
          </div>
          <div className="text-right">
            <StatusBadge status={sub.status} cancelAtPeriodEnd={sub.cancelAtPeriodEnd} />
            {periodEnd && (
              <div className="mt-2 flex items-center justify-end gap-1 text-xs text-ink-600">
                <Calendar className="h-3 w-3" />
                {sub.cancelAtPeriodEnd ? "Ends" : "Renews"} {periodEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                {daysUntilRenewal !== null && ` · ${daysUntilRenewal} days`}
              </div>
            )}
          </div>
        </div>

        {sub.cancelAtPeriodEnd && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              Subscription is set to cancel at the end of the current period. After{" "}
              {periodEnd?.toLocaleDateString()} your workspace will downgrade to the Free tier.
              Resume in the Stripe portal to keep your plan.
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium hover:bg-ink-50"
          >
            <ArrowUpRight className="h-4 w-4" /> Compare plans
          </a>
          <form action="/api/billing/portal" method="post">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
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
          {sub.paymentMethod ? (
            <div className="mt-2 text-sm">
              <div className="font-medium capitalize">{sub.paymentMethod.brand} •••• {sub.paymentMethod.last4}</div>
              <div className="text-xs text-ink-600">
                Expires {String(sub.paymentMethod.expMonth).padStart(2, "0")}/{sub.paymentMethod.expYear}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-600">
              {sub.plan === "free"
                ? "No payment method on file. Add one when you upgrade."
                : "No payment method recorded."}
            </p>
          )}
          <form action="/api/billing/portal" method="post" className="mt-3">
            <button
              type="submit"
              className="text-sm font-medium text-terracotta-700 hover:underline"
            >
              {sub.paymentMethod ? "Update →" : "Add payment method →"}
            </button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4 text-ink-500" />
            <span className="font-semibold">Invoices</span>
          </div>
          <p className="mt-2 text-sm text-ink-600">
            {isActive
              ? "Invoices arrive monthly by email and are accessible in the Stripe portal."
              : "No invoices yet."}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold">Plan limits</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <LimitRow label="Certificates / month" value={plan.limits.certificatesPerMonth} />
          <LimitRow label="Workspace members" value={plan.limits.members} />
          <LimitRow label="Bulk classify rows" value={plan.limits.bulkRows} />
        </ul>
        <a
          href="/pricing"
          className="mt-4 inline-block text-sm font-medium text-terracotta-700 hover:underline"
        >
          Need more? See pricing →
        </a>
      </Card>
    </div>
  );
}

function StatusBadge({ status, cancelAtPeriodEnd }: { status: string; cancelAtPeriodEnd: boolean }) {
  if (cancelAtPeriodEnd) return <Badge tone="warn">Cancelling</Badge>;
  if (status === "active") return <Badge tone="savanna"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
  if (status === "trialing") return <Badge tone="info">Trialing</Badge>;
  if (status === "past_due") return <Badge tone="warn">Past due</Badge>;
  if (status === "canceled") return <Badge tone="terracotta">Canceled</Badge>;
  if (status === "none") return <Badge tone="neutral">Free</Badge>;
  return <Badge tone="neutral">{status}</Badge>;
}

function LimitRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-lg border border-ink-100 bg-sand-50/40 p-3">
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold">
        {value === Infinity ? "∞" : value.toLocaleString()}
      </div>
    </li>
  );
}

function formatPrice(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}
