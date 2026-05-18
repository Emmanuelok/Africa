import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  Wallet,
  FileCheck2,
  ShieldCheck,
  MessageSquare,
  Globe2,
  Clock,
  Package
} from "lucide-react";
import { getProduct, PRODUCTS } from "@/lib/data/products";
import { getSupplier } from "@/lib/data/suppliers";
import { getCountry } from "@/lib/data/countries";
import { lookupTariff } from "@/lib/data/tariffs";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }));
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = getProduct(params.id);
  if (!product) return notFound();

  const supplier = getSupplier(product.supplierId);
  const origin = getCountry(product.origin);
  const tariff = lookupTariff(product.hsCode);

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <nav className="text-sm text-ink-500">
          <Link href="/marketplace" className="hover:text-terracotta-700">Marketplace</Link>
          <span className="mx-2">/</span>
          <span>{product.category}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {/* Left: product info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="grid h-48 w-48 shrink-0 place-items-center rounded-2xl bg-sand-50 text-8xl">
                  {product.image}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="terracotta">{product.category}</Badge>
                    <Badge tone="neutral">HS {product.hsCode}</Badge>
                    {origin && <Badge tone="sand">{origin.flag} {origin.name}</Badge>}
                  </div>
                  <h1 className="mt-3 font-display text-3xl font-semibold">{product.name}</h1>
                  <p className="mt-3 text-ink-700">{product.description}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {product.tags.map((t) => (
                      <Badge key={t} tone="savanna">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="font-semibold">Specifications</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-ink-50 px-3 py-2">
                    <dt className="text-xs uppercase tracking-wide text-ink-500">{k}</dt>
                    <dd className="text-sm font-medium text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            {tariff && (
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">AfCFTA tariff preview</h2>
                  <Badge tone="info">Category {tariff.afcftaCategory}</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-600">{tariff.description}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <Stat label="MFN rate" value={`${tariff.mfnRate.toFixed(1)}%`} muted />
                  <Stat
                    label="AfCFTA rate (May 2026)"
                    value={`${tariff.afcftaRate.toFixed(1)}%`}
                    highlight
                  />
                  <Stat
                    label="You save"
                    value={`${(tariff.mfnRate - tariff.afcftaRate).toFixed(1)} pp`}
                    accent
                  />
                </div>
                <p className="mt-4 text-xs text-ink-500">
                  Indicative duty for goods qualifying under AfCFTA Rules of Origin. Use the{" "}
                  <Link href="/afcfta" className="text-terracotta-700 underline">AfCFTA Toolkit</Link>{" "}
                  to confirm RoO eligibility.
                </p>
              </Card>
            )}

            {supplier && (
              <Card>
                <h2 className="font-semibold">Supplier</h2>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-terracotta-50 text-2xl font-semibold text-terracotta-700">
                    {supplier.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <Link href={`/suppliers#${supplier.id}`} className="font-semibold hover:text-terracotta-700">
                      {supplier.name}
                    </Link>
                    <div className="mt-1 text-sm text-ink-600">
                      {supplier.city}, {origin?.name} · Est. {supplier.founded} · {supplier.employees} employees
                    </div>
                    <p className="mt-2 text-sm text-ink-700">{supplier.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {supplier.verified && (
                        <Badge tone="savanna"><ShieldCheck className="h-3 w-3" /> {supplier.kybLevel} KYB</Badge>
                      )}
                      {supplier.afcftaApproved && <Badge tone="info">AfCFTA Approved Exporter</Badge>}
                      <Badge tone="sand">★ {supplier.rating} · {formatNumber(supplier.ordersFulfilled)} orders</Badge>
                      <Badge tone="neutral"><Clock className="h-3 w-3" /> Replies in ~{supplier.responseHrs}h</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right: pricing + RFQ */}
          <div className="space-y-6">
            <Card>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl font-semibold">
                  {formatCurrency(product.pricePerUnit, product.currency)}
                </span>
                <span className="text-ink-500">/ {product.unit}</span>
              </div>
              <div className="mt-1 text-xs text-ink-500">Indicative FOB; quantity discounts on request</div>

              <div className="mt-5 space-y-3 text-sm">
                <Row icon={<Package className="h-4 w-4" />} k="Minimum order" v={`${formatNumber(product.moq)} ${product.unit}`} />
                <Row icon={<Globe2 className="h-4 w-4" />} k="In stock" v={`${formatNumber(product.inStock)} ${product.unit}`} />
                <Row icon={<Clock className="h-4 w-4" />} k="Lead time" v={`${product.leadTimeDays} days`} />
                <Row icon={<Wallet className="h-4 w-4" />} k="Settlement" v={origin?.papssLive ? "PAPSS-eligible" : "Bank transfer"} />
              </div>

              <Button href={`/dashboard?rfq=${product.id}`} className="mt-6 w-full">
                <MessageSquare className="h-4 w-4" /> Request a Quote
              </Button>
              <Button href="/afcfta" variant="outline" className="mt-2 w-full">
                <FileCheck2 className="h-4 w-4" /> Generate e-CoO
              </Button>
            </Card>

            <Card>
              <h3 className="font-semibold">Logistics estimate</h3>
              <p className="mt-2 text-xs text-ink-500">From {origin?.name} via top corridors</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Truck className="mt-0.5 h-4 w-4 text-ink-400" />
                  <div>
                    <div className="font-medium">Road + sea (multi-corridor)</div>
                    <div className="text-ink-500">14-21 days · 2 customs touchpoints</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Truck className="mt-0.5 h-4 w-4 text-ink-400" />
                  <div>
                    <div className="font-medium">Air freight (priority)</div>
                    <div className="text-ink-500">3-5 days · premium rate</div>
                  </div>
                </li>
              </ul>
              <Link href="/logistics" className="mt-4 inline-block text-sm font-medium text-terracotta-700 hover:underline">
                See vetted forwarders →
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 pb-2 last:border-0">
      <span className="flex items-center gap-2 text-ink-500">{icon}{k}</span>
      <span className="font-medium text-ink-900">{v}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  muted,
  highlight,
  accent
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-4 ${
        accent
          ? "bg-terracotta-50 text-terracotta-700"
          : highlight
          ? "bg-savanna-50 text-savanna-700"
          : "bg-ink-50 text-ink-700"
      }`}
    >
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold ${muted ? "line-through opacity-60" : ""}`}>
        {value}
      </div>
    </div>
  );
}
