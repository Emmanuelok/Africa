import Link from "next/link";
import {
  TrendingUp,
  PackageCheck,
  Wallet,
  AlertTriangle,
  MessageSquare,
  ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getProduct } from "@/lib/data/products";
import { getSupplier } from "@/lib/data/suppliers";
import { getCountry } from "@/lib/data/countries";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Dashboard — Sokoni" };

const ORDERS = [
  { id: "SK-2026-0418", productId: "p-002", qty: 25000, status: "In transit" as const, eta: "May 28" },
  { id: "SK-2026-0411", productId: "p-007", qty: 1200, status: "Customs clearance" as const, eta: "May 22" },
  { id: "SK-2026-0395", productId: "p-001", qty: 1500, status: "Delivered" as const, eta: "Apr 30" },
  { id: "SK-2026-0388", productId: "p-005", qty: 2000, status: "RFQ open" as const, eta: "—" }
];

const RFQS = [
  { id: "RFQ-7741", productId: "p-006", from: "Lagos, NG", to: "Casablanca, MA", value: 18400 },
  { id: "RFQ-7732", productId: "p-008", from: "Cairo, EG", to: "Nairobi, KE", value: 412000 },
  { id: "RFQ-7724", productId: "p-009", from: "Accra, GH", to: "Tunis, TN", value: 25020 }
];

export default function DashboardPage({
  searchParams
}: {
  searchParams?: { rfq?: string };
}) {
  const rfqProduct = searchParams?.rfq ? getProduct(searchParams.rfq) : null;

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="terracotta">Dashboard</Badge>
            <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              Welcome back, Amara
            </h1>
            <p className="mt-1 text-ink-600">Trade Operations Lead · Lagos, Nigeria</p>
          </div>
          <Button href="/marketplace" size="md">
            Find new suppliers
          </Button>
        </div>

        {rfqProduct && (
          <Card className="mt-8 border-terracotta-200 bg-terracotta-50">
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-5 w-5 text-terracotta-700" />
              <div className="flex-1">
                <div className="font-semibold text-terracotta-900">
                  RFQ draft ready for <em>{rfqProduct.name}</em>
                </div>
                <p className="mt-1 text-sm text-terracotta-800">
                  We pre-filled MOQ ({rfqProduct.moq.toLocaleString()} {rfqProduct.unit}), HS code{" "}
                  {rfqProduct.hsCode}, and routed it to the supplier in their working language.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="primary">Send RFQ</Button>
                  <Button size="sm" variant="outline" href="/dashboard">Discard</Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* KPIs */}
        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <Kpi icon={<PackageCheck className="h-5 w-5" />} label="Active orders" value="14" delta="+3 vs. April" />
          <Kpi icon={<TrendingUp className="h-5 w-5" />} label="TTM trade volume" value={formatCurrency(2_140_000)} delta="+38% YoY" />
          <Kpi icon={<Wallet className="h-5 w-5" />} label="PAPSS-settled %" value="62%" delta="USD costs avoided: $44.2k" />
          <Kpi icon={<AlertTriangle className="h-5 w-5" />} label="Documents pending" value="3" delta="2 CoO · 1 invoice" tone="warn" />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Orders */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-xl font-semibold">Recent orders</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-ink-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {ORDERS.map((o) => {
                    const p = getProduct(o.productId);
                    const s = p ? getSupplier(p.supplierId) : null;
                    return (
                      <tr key={o.id} className="hover:bg-sand-50/40">
                        <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                        <td className="px-4 py-3">
                          <Link href={`/marketplace/${p?.id ?? ""}`} className="font-medium hover:text-terracotta-700">
                            {p?.name}
                          </Link>
                          <div className="text-xs text-ink-500">
                            {o.qty.toLocaleString()} {p?.unit}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-700">{s?.name}</td>
                        <td className="px-4 py-3">
                          <StatusPill status={o.status} />
                        </td>
                        <td className="px-4 py-3 text-ink-700">{o.eta}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Open RFQs */}
          <div>
            <h2 className="font-display text-xl font-semibold">Open RFQs received</h2>
            <div className="mt-4 space-y-3">
              {RFQS.map((r) => {
                const p = getProduct(r.productId);
                return (
                  <Card key={r.id} className="lift">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-mono text-ink-500">{r.id}</div>
                        <div className="font-medium">{p?.name}</div>
                        <div className="mt-1 text-xs text-ink-600">{r.from} → {r.to}</div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-ink-400" />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-ink-500">Estimated value</span>
                      <span className="font-semibold">{formatCurrency(r.value)}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* PAPSS callout */}
        <Card className="mt-10 bg-gradient-to-br from-savanna-700 to-savanna-900 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge tone="sand" className="border-savanna-200 bg-savanna-100 text-savanna-900">
                PAPSS integration
              </Badge>
              <h3 className="mt-3 font-display text-xl font-semibold">
                You&apos;ve avoided $44,200 in FX & correspondent-bank fees this year.
              </h3>
              <p className="mt-1 text-sm text-savanna-100">
                Across 18 PAPSS-routed settlements between NGN and KES, ZMW, EGP, GHS.
              </p>
            </div>
            <Button variant="secondary" className="bg-white text-ink-900 hover:bg-ink-100">
              View settlement history
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  delta,
  tone = "neutral"
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
  tone?: "neutral" | "warn";
}) {
  return (
    <Card>
      <div
        className={`grid h-10 w-10 place-items-center rounded-lg ${
          tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-terracotta-50 text-terracotta-700"
        }`}
      >
        {icon}
      </div>
      <div className="mt-4 text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 font-display text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-ink-600">{delta}</div>
    </Card>
  );
}

function StatusPill({ status }: { status: "In transit" | "Customs clearance" | "Delivered" | "RFQ open" }) {
  const map = {
    "In transit": "bg-blue-50 text-blue-700 border-blue-200",
    "Customs clearance": "bg-amber-50 text-amber-700 border-amber-200",
    Delivered: "bg-green-50 text-green-700 border-green-200",
    "RFQ open": "bg-terracotta-50 text-terracotta-700 border-terracotta-200"
  } as const;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}
