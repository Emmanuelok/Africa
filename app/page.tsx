import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Wallet,
  FileCheck2,
  Truck,
  Languages,
  Sparkles,
  TrendingUp,
  Globe2,
  Users,
  PackageSearch
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CommodityTicker } from "@/components/CommodityTicker";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="animate-fade-up">
              <Badge tone="terracotta" className="mb-5">
                <Sparkles className="h-3 w-3" /> Built for AfCFTA — 1.3B people, $3.4T GDP
              </Badge>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900 md:text-6xl">
                Africa&apos;s trade engine.
                <br />
                <span className="text-gradient">One continent. One platform.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-700">
                Intra-African trade is stuck at <strong>16%</strong> — versus 59% in Asia and 68% in Europe.
                Sokoni is the unified B2B platform that makes cross-border trade across all 54 African
                states finally work.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/marketplace" size="lg">
                  Browse Marketplace <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/afcfta" size="lg" variant="outline">
                  Try AfCFTA Calculator
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-ink-600">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-savanna-600" /> KYB-verified suppliers</span>
                <span className="flex items-center gap-2"><Wallet className="h-4 w-4 text-savanna-600" /> PAPSS-ready settlement</span>
                <span className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-savanna-600" /> e-Certificates of Origin</span>
              </div>
            </div>

            <div className="relative animate-fade-in">
              <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-ink-500">Trade match</div>
                    <div className="text-lg font-semibold">Lagos buyer ↔ Mombasa supplier</div>
                  </div>
                  <Badge tone="success">98% fit</Badge>
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <Row k="Product" v="Arabica Green Coffee, AA Grade" />
                  <Row k="Quantity" v="3,200 kg" />
                  <Row k="MFN duty (Nigeria)" v="12.5%" strike />
                  <Row k="AfCFTA duty (Cat. A)" v="2.5%" highlight />
                  <Row k="Settlement" v="KES → NGN via PAPSS" />
                  <Row k="ETA via Mombasa→Lagos" v="14 days" />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Saved" value="$2,310" tone="savanna" />
                  <Stat label="Vs. USD route" value="-7.4%" tone="terracotta" />
                  <Stat label="Time saved" value="6 days" tone="sand" />
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-6 -right-6 -z-10 h-40 w-40 rounded-full bg-terracotta-300/40 blur-3xl" />
              <div className="pointer-events-none absolute -top-6 -left-6 -z-10 h-40 w-40 rounded-full bg-savanna-300/40 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      <CommodityTicker />

      {/* The Problem */}
      <section className="bg-pattern">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="terracotta">The problem</Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
              Africa trades with the world more than it trades with itself.
            </h2>
            <p className="mt-4 text-ink-700">
              The 2025 AfCFTA scorecard is sobering: a 1.3-billion-person market is held back by a stack of
              friction points that no single existing platform addresses end-to-end.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <PainCard
              stat="16-17%"
              title="Intra-African trade share"
              body="Compared to 59% in Asia and 68% in Europe. Africa still exports raw materials north, not east-or-west."
              source="UNCTAD, 2025"
            />
            <PainCard
              stat="80%+"
              title="Payments routed through USD/EUR"
              body="Most intra-African payments still clear through offshore correspondent banks, adding fees up to 10% and delays of days or weeks."
              source="World Bank FASTT"
            />
            <PainCard
              stat="29%"
              title="Road transport share of final price"
              body="Logistics costs are 4× the global average. Corridor delays, multiple checkpoints, and customs duplication compound it."
              source="UNECA"
            />
            <PainCard
              stat="15%"
              title="of SSA SMEs in international trade"
              body="Most platforms either exclude African sellers or favour large traders. SMEs are stranded outside formal cross-border flows."
              source="ITC, 2025"
            />
            <PainCard
              stat="42"
              title="currencies, 54 customs regimes"
              body="Each shipment can touch 4-7 different rule sets. Documentation errors are the #1 cause of held containers."
              source="WCO / AfCFTA Sec."
            />
            <PainCard
              stat="18-300%"
              title="effective tariff from NTBs"
              body="Non-tariff barriers — phytosanitary, licensing, port handling — quietly erase the AfCFTA's headline 90% liberalization."
              source="Business Tech Africa, 2026"
            />
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="grid items-end gap-6 md:grid-cols-2">
            <div>
              <Badge tone="savanna">The solution</Badge>
              <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
                One platform. Every friction point, addressed.
              </h2>
            </div>
            <p className="text-ink-700">
              Sokoni unifies discovery, verification, payments, documentation, and logistics — built natively
              on the AfCFTA framework and the AU&apos;s 2025 Digital Trade Protocol. Existing tools solve one
              piece each. Sokoni stitches them together.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<PackageSearch className="h-5 w-5" />}
              title="Pan-African marketplace"
              body="Raw materials, processed goods, and finished products from every African state — discoverable in one place, filterable by AfCFTA-origin status."
            />
            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              title="KYB-verified suppliers"
              body="Four-tier business verification (Basic → Platinum) tied to national company registries. No more pay-then-pray cross-border deals."
            />
            <Feature
              icon={<Wallet className="h-5 w-5" />}
              title="PAPSS-ready settlement"
              body="Buyer pays in NGN, supplier receives in KES — instantly, no USD round-trip. Live in 13 countries today; rolling out continent-wide."
            />
            <Feature
              icon={<FileCheck2 className="h-5 w-5" />}
              title="Digital trade docs"
              body="Generate e-Certificates of Origin, commercial invoices, and packing lists that conform to the 2025 AU Digital Trade Protocol."
            />
            <Feature
              icon={<Truck className="h-5 w-5" />}
              title="Corridor-aware logistics"
              body="Match shipments to vetted freight forwarders and customs brokers along the actual trade corridor — Abidjan-Lagos, Mombasa-Kigali, Durban-Lubumbashi."
            />
            <Feature
              icon={<Sparkles className="h-5 w-5" />}
              title="AfCFTA tariff intelligence"
              body="Real-time HS-code lookup with MFN vs. preferential rate, RoO eligibility check, and category phase-down timeline."
            />
            <Feature
              icon={<TrendingUp className="h-5 w-5" />}
              title="Live commodity benchmarks"
              body="Continental price discovery for cocoa, coffee, cobalt, copper, cashew and 20+ commodities — so SMEs don&apos;t negotiate blind."
            />
            <Feature
              icon={<Languages className="h-5 w-5" />}
              title="Multi-language by default"
              body="English, French, Portuguese, Arabic, Swahili. Listings auto-translate, RFQs route in the buyer&apos;s language."
            />
            <Feature
              icon={<Users className="h-5 w-5" />}
              title="Built for SMEs first"
              body="No platform-listing restrictions for African businesses, no minimum revenue gate. The 85% of SMEs locked out today are the target user."
            />
          </div>
        </div>
      </section>

      {/* Reach / stats */}
      <section className="bg-ink-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <BigStat label="African states covered" value="54" sub="Every AfCFTA signatory" />
            <BigStat label="Currencies supported" value="42" sub="PAPSS-routed where available" />
            <BigStat label="HS codes mapped" value="5,200+" sub="With AfCFTA preferential rates" />
            <BigStat label="Trade corridors live" value="36" sub="Across road, rail, sea, air" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pattern">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
          <Globe2 className="mx-auto h-10 w-10 text-terracotta-600" />
          <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
            The AfCFTA is law. Sokoni is how it actually gets used.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-700">
            Whether you&apos;re a Ghanaian shea cooperative shipping to Cairo, a Kenyan coffee estate
            invoicing Lagos, or a Zambian smelter routing copper to Tangier — start here.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/marketplace" size="lg">Explore the marketplace</Button>
            <Button href="/research" size="lg" variant="outline">Read our research</Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Row({
  k,
  v,
  highlight,
  strike
}: {
  k: string;
  v: string;
  highlight?: boolean;
  strike?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-ink-100 pb-2 last:border-0">
      <span className="text-ink-500">{k}</span>
      <span
        className={
          highlight
            ? "font-semibold text-savanna-700"
            : strike
            ? "text-ink-400 line-through"
            : "font-medium text-ink-900"
        }
      >
        {v}
      </span>
    </div>
  );
}

function Stat({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "savanna" | "terracotta" | "sand";
}) {
  const tones = {
    savanna: "bg-savanna-50 text-savanna-700",
    terracotta: "bg-terracotta-50 text-terracotta-700",
    sand: "bg-sand-50 text-sand-700"
  } as const;
  return (
    <div className={`rounded-lg p-3 ${tones[tone]}`}>
      <div className="text-xs">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function PainCard({
  stat,
  title,
  body,
  source
}: {
  stat: string;
  title: string;
  body: string;
  source: string;
}) {
  return (
    <Card className="lift">
      <div className="font-display text-4xl font-semibold text-terracotta-700">{stat}</div>
      <div className="mt-2 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-ink-700">{body}</p>
      <div className="mt-4 text-xs text-ink-500">Source: {source}</div>
    </Card>
  );
}

function Feature({
  icon,
  title,
  body
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="lift">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-savanna-50 text-savanna-700">
        {icon}
      </div>
      <div className="mt-4 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-ink-700">{body}</p>
    </Card>
  );
}

function BigStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-sm uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-2 font-display text-5xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-ink-300">{sub}</div>
    </div>
  );
}
