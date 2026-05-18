import Link from "next/link";
import { Check, Sparkles, Building2, Briefcase, Code2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Pricing — Sokoni AfriOrigin" };

type Plan = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  cta: string;
  href: string;
  highlight?: boolean;
  icon: React.ElementType;
  features: string[];
  meta?: string;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "/forever",
    description: "Try AfriOrigin on one shipment a month.",
    cta: "Start free",
    href: "/afriorigin",
    icon: Sparkles,
    features: [
      "1 origin determination / month",
      "HS classification (3 / month)",
      "Tariff savings calculator",
      "View-only Certificate preview",
      "Community support"
    ]
  },
  {
    name: "Pro SME",
    price: "$49",
    cadence: "/month",
    description: "For one exporter shipping under AfCFTA regularly.",
    cta: "Start Pro",
    href: "/afriorigin",
    highlight: true,
    icon: Briefcase,
    features: [
      "Unlimited HS classifications",
      "Unlimited origin determinations",
      "5 Certificates of Origin / month",
      "All 25 published tariff schedules",
      "Email support, 24h response"
    ]
  },
  {
    name: "SME Bulk",
    price: "$149",
    cadence: "/month",
    description: "For growing exporters or co-operatives running many SKUs.",
    cta: "Start Bulk",
    href: "/afriorigin",
    icon: Building2,
    features: [
      "Everything in Pro SME",
      "25 Certificates of Origin / month",
      "Bulk classification (CSV upload)",
      "Multi-user workspace (up to 5)",
      "Priority support, 4h response"
    ]
  },
  {
    name: "Forwarder",
    price: "$299",
    cadence: "/month + $5/cert",
    description: "Multi-tenant for freight forwarders & customs brokers.",
    cta: "Talk to sales",
    href: "/afriorigin",
    icon: Briefcase,
    meta: "$5 per additional certificate",
    features: [
      "Unlimited client workspaces",
      "Multi-tenant dashboards",
      "White-label PDF certificates",
      "Webhook integrations",
      "Dedicated account manager"
    ]
  }
];

export default function PricingPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <Badge tone="terracotta">Pricing</Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold md:text-5xl">
            Compliance that pays for itself in one shipment.
          </h1>
          <p className="mt-4 text-ink-700">
            SMEs pay freight forwarders <strong>$200-500 per shipment</strong> for AfCFTA paperwork —
            often blind to whether the rate even applies. AfriOrigin is a fraction of that, and you
            see the answer before you ship.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => {
            const Icon = p.icon;
            return (
              <Card
                key={p.name}
                className={`flex h-full flex-col lift ${
                  p.highlight ? "border-terracotta-500 ring-2 ring-terracotta-200" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-terracotta-50 text-terracotta-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  {p.highlight && <Badge tone="terracotta">Most popular</Badge>}
                </div>
                <h2 className="mt-4 font-display text-xl font-semibold">{p.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold">{p.price}</span>
                  <span className="text-sm text-ink-500">{p.cadence}</span>
                </div>
                {p.meta && <div className="text-xs text-ink-500">{p.meta}</div>}
                <p className="mt-3 text-sm text-ink-600">{p.description}</p>

                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-savanna-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  href={p.href}
                  variant={p.highlight ? "primary" : "outline"}
                  className="mt-6 w-full"
                >
                  {p.cta}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* API pricing */}
        <Card className="mt-12">
          <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-ink-900 text-white">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">Developer API</h2>
              <p className="mt-1 text-ink-700">
                Embed AfCFTA compliance into your ERP, freight, or e-commerce stack. Pay per call —
                no monthly minimum. Bulk-volume discounts past 100k calls/month.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-lg bg-ink-100 px-3 py-1 font-mono">$0.10 / classification</span>
                <span className="rounded-lg bg-ink-100 px-3 py-1 font-mono">$0.20 / origin determination</span>
                <span className="rounded-lg bg-ink-100 px-3 py-1 font-mono">$1.50 / certificate</span>
              </div>
            </div>
            <Button href="/developers" variant="secondary">
              View API docs
            </Button>
          </div>
        </Card>

        {/* FAQ-ish */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-center">Questions you might have</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <QA q="Is this a legal certificate?" a="AfriOrigin generates the Certificate of Origin in the format prescribed by Annex II, Appendix I of the AfCFTA Protocol on Trade in Goods. Per the 2025 Digital Trade Protocol, all State Parties accept it electronically. Final stamping by your national competent authority is required where applicable — we walk you through that handoff." />
            <QA q="Which countries are supported in v1?" a="The 25 AfCFTA states with published tariff schedules: Algeria, Cameroon, Côte d'Ivoire, Egypt, Ghana, Kenya, Morocco, Nigeria, Rwanda, Senegal, South Africa, Tanzania, Tunisia, Uganda, and 11 more. New schedules are added within 30 days of publication." />
            <QA q="What about non-AfCFTA destinations?" a="Out of scope for v1. We focus on intra-African trade where AfCFTA preferences apply. If you need EU/US/UK shipping documentation, we'll point you to specialised partners." />
            <QA q="How accurate is the HS classification?" a="High confidence (>90%) for the 200 most-shipped African export categories. For ambiguous cases we surface alternates and explain the rationale. Annual rule reviews by our compliance team keep the classifier current with HS 2022 amendments." />
            <QA q="Can I cancel anytime?" a="Yes. Monthly plans cancel at the end of the current period. No long-term contract. Forwarder plans have a 3-month minimum to cover onboarding." />
            <QA q="Do you take a cut of trade flows?" a="No. Sokoni AfriOrigin is pure SaaS. We don't escrow funds, take a payment percentage, or own inventory. Your customer relationships and margins stay yours." />
          </div>
        </section>

        <section className="mt-16 rounded-2xl bg-ink-950 px-6 py-12 text-center text-white md:px-12">
          <h2 className="font-display text-3xl font-semibold">Ship under AfCFTA with confidence.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-200">
            One determination beats one missed preferential rate. Try it free — no card required.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/afriorigin"
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-6 py-3 font-medium text-white hover:bg-terracotta-700"
            >
              Run a free determination
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 rounded-lg border border-ink-700 px-6 py-3 font-medium text-white hover:bg-ink-900"
            >
              Explore the API
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="font-semibold">{q}</div>
      <p className="mt-2 text-sm text-ink-700">{a}</p>
    </div>
  );
}
