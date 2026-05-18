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
  PackageSearch,
  Wand2,
  Code2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CommodityTicker } from "@/components/CommodityTicker";
import { TradeOSDiagram } from "@/components/TradeOSDiagram";

export default function HomePage() {
  return (
    <>
      {/* HERO — AfriOrigin first */}
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="animate-fade-up">
              <Badge tone="terracotta" className="mb-5">
                <Sparkles className="h-3 w-3" /> AfriOrigin — AfCFTA compliance in seconds
              </Badge>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900 md:text-6xl">
                Stop paying <span className="text-terracotta-600">$300/shipment</span> to figure out
                AfCFTA.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-ink-700">
                Tell us what you&apos;re shipping. AfriOrigin classifies the HS code, checks the
                Rules of Origin, calculates your tariff savings, and generates a customs-ready
                Certificate of Origin — in <strong>60 seconds</strong>, in <strong>5 languages</strong>.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/afriorigin" size="lg">
                  Run a free determination <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/pricing" size="lg" variant="outline">
                  See pricing
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-600">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-savanna-600" /> No card required</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-savanna-600" /> 1 determination free / month</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-savanna-600" /> 25 countries supported</span>
              </div>
            </div>

            {/* Mock wizard preview */}
            <div className="relative animate-fade-in">
              <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-ink-500">
                  <span>Step 3 of 3 · Result</span>
                  <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> Qualifies</Badge>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-ink-500">Trade lane</div>
                  <div className="text-sm font-semibold">🇰🇪 Kenya → 🇳🇬 Nigeria</div>
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  <Row k="HS code" v="0901.11" mono />
                  <Row k="Product" v="Arabica green coffee, AA grade" />
                  <Row k="Rule applied" v="Wholly Obtained (Art. 5)" />
                  <Row k="MFN duty" v="$1,162" strike />
                  <Row k="AfCFTA duty" v="$232" highlight />
                </div>
                <div className="mt-5 rounded-xl bg-savanna-50 p-4 text-center">
                  <div className="text-xs uppercase tracking-wide text-savanna-700">You save</div>
                  <div className="font-display text-3xl font-semibold text-savanna-900">$930</div>
                  <div className="text-xs text-savanna-700">on a $9,300 shipment · 10.0%</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-xs text-ink-700">
                    📄 Certificate of Origin ready
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-6 -right-6 -z-10 h-40 w-40 rounded-full bg-terracotta-300/40 blur-3xl" />
              <div className="pointer-events-none absolute -top-6 -left-6 -z-10 h-40 w-40 rounded-full bg-savanna-300/40 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      <CommodityTicker />

      {/* HOW IT WORKS */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="terracotta">How it works</Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
              Three steps. Sixty seconds. One Certificate of Origin.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Step n={1} icon={<Wand2 className="h-6 w-6" />} title="Describe your product" body="Free-text product description. AI classifies the HS 2022 code with confidence score and alternates." />
            <Step n={2} icon={<ShieldCheck className="h-6 w-6" />} title="Origin determination" body="Answer 2-3 questions about how the goods were made. We apply the right Rules of Origin and explain the verdict in plain language." />
            <Step n={3} icon={<FileCheck2 className="h-6 w-6" />} title="Savings & certificate" body="See MFN vs AfCFTA duty, exact savings in USD, and download a print-ready Certificate of Origin (Annex II format)." />
          </div>

          <div className="mt-10 flex justify-center">
            <Button href="/afriorigin" size="lg">
              Try the wizard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="bg-pattern">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="terracotta">The problem</Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
              The AfCFTA is law. Most African SMEs still can&apos;t use it.
            </h2>
            <p className="mt-4 text-ink-700">
              The headline 90%-of-tariff-lines liberalization is real — but only if your goods meet
              the Rules of Origin and you file the right paperwork. Today&apos;s options: pay a
              freight forwarder $200-500 per shipment, or guess.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <PainCard
              stat="$200-500"
              title="Paid to forwarders per shipment"
              body="For AfCFTA compliance — often paid blind, with no SME visibility into whether the preferential rate even applies."
            />
            <PainCard
              stat="16-17%"
              title="Intra-African trade share"
              body="Versus 59% in Asia and 68% in Europe. The AfCFTA's 1.3B-person market is barely trading with itself."
            />
            <PainCard
              stat="80%+"
              title="Payments via offshore USD/EUR"
              body="Most intra-African transfers still clear through correspondent banks in London or New York. Fees up to 10%."
            />
            <PainCard
              stat="29%"
              title="Road transport in final price"
              body="Africa's logistics costs are 4× the global average. Documentation errors are the #1 cause of held containers."
            />
            <PainCard
              stat="15%"
              title="SSA SMEs in international trade"
              body="Existing platforms exclude or under-serve African SMEs. The 85% locked out today are AfriOrigin's market."
            />
            <PainCard
              stat="18-300%"
              title="Effective NTB tariff"
              body="Non-tariff barriers — phytosanitary, licensing, port handling — quietly erase the AfCFTA's 90% liberalization."
            />
          </div>
        </div>
      </section>

      {/* TRADEOS VISION */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="savanna">The bigger play</Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
              AfriOrigin is module one of a TradeOS for Africa.
            </h2>
            <p className="mt-4 text-ink-700">
              Compliance is the wedge. Once an SME&apos;s identity, shipment history, and buyer
              relationships are on Sokoni, the rest of the stack — payments, logistics, trade
              finance — runs on the same verified-business graph.
            </p>
          </div>
          <div className="mt-12">
            <TradeOSDiagram />
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="bg-pattern">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <Badge tone="terracotta">What ships in v1</Badge>
          <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
            AfriOrigin capabilities
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Feature icon={<Wand2 className="h-5 w-5" />} title="AI-assisted HS classification" body="From a plain-text product description. HS 2022 nomenclature with confidence scoring and alternates." />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Rules of Origin engine" body="Wholly Obtained, CTH, Regional Value Content — chapter-appropriate rule, plain-language reasoning." />
            <Feature icon={<TrendingUp className="h-5 w-5" />} title="Tariff savings calculator" body="MFN vs AfCFTA preferential rate, exact USD savings on your shipment, phase-down timeline." />
            <Feature icon={<FileCheck2 className="h-5 w-5" />} title="Certificate of Origin PDF" body="Annex II Appendix I format. e-Signature ready. Validated by the 2025 AU Digital Trade Protocol." />
            <Feature icon={<Languages className="h-5 w-5" />} title="Five languages" body="English, French, Portuguese, Arabic, Swahili. Listings, RFQs, and certificates in the user's language." />
            <Feature icon={<Code2 className="h-5 w-5" />} title="Developer API" body="REST + JSON. Embed AfCFTA compliance into ERPs, freight platforms, e-commerce. Predictable per-call pricing." />
            <Feature icon={<Wallet className="h-5 w-5" />} title="PAPSS-aware settlement" body="See which trade lanes settle instantly in local currency vs. require fallback bank wires." />
            <Feature icon={<Users className="h-5 w-5" />} title="SME-first, free tier" body="No platform-listing restrictions for African businesses. No revenue gate. One determination free every month." />
            <Feature icon={<Globe2 className="h-5 w-5" />} title="25-country coverage" body="Every AfCFTA state with a published tariff schedule. New schedules added within 30 days of publication." />
          </div>
        </div>
      </section>

      {/* PROOF / SOCIAL */}
      <section className="bg-ink-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <BigStat label="State Parties covered" value="25" sub="Of 54 AU members, with published schedules" />
            <BigStat label="HS codes mapped" value="5,200+" sub="With AfCFTA preferential rates" />
            <BigStat label="Languages" value="5" sub="EN · FR · PT · AR · SW" />
            <BigStat label="Time saved per shipment" value="3-7 days" sub="Vs. forwarder paperwork loop" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-pattern">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
          <PackageSearch className="mx-auto h-10 w-10 text-terracotta-600" />
          <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
            Ship under AfCFTA. In your language. In 60 seconds.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-700">
            Whether you&apos;re a Ghanaian shea cooperative, a Kenyan coffee estate, or a Zambian
            smelter — start with a free determination. No card, no commitment.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/afriorigin" size="lg">Try AfriOrigin free</Button>
            <Button href="/pricing" size="lg" variant="outline">See pricing</Button>
            <Button href="/research" size="lg" variant="ghost">Read the research</Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-ink-500">
            <span>
              <Link href="/marketplace" className="underline-offset-2 hover:underline">Marketplace</Link> ·{" "}
              <Link href="/suppliers" className="underline-offset-2 hover:underline">Suppliers</Link> ·{" "}
              <Link href="/commodities" className="underline-offset-2 hover:underline">Commodities</Link> ·{" "}
              <Link href="/logistics" className="underline-offset-2 hover:underline">Logistics</Link>
              <span className="ml-2 text-ink-400">(roadmap)</span>
            </span>
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
  strike,
  mono
}: {
  k: string;
  v: string;
  highlight?: boolean;
  strike?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-ink-100 pb-2 last:border-0">
      <span className="text-ink-500">{k}</span>
      <span
        className={`${mono ? "font-mono" : ""} ${
          highlight
            ? "font-semibold text-savanna-700"
            : strike
            ? "text-ink-400 line-through"
            : "font-medium text-ink-900"
        }`}
      >
        {v}
      </span>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="lift relative overflow-hidden">
      <div className="absolute right-4 top-4 font-display text-6xl font-bold text-terracotta-100">
        {n}
      </div>
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-terracotta-50 text-terracotta-700">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-ink-700">{body}</p>
    </Card>
  );
}

function PainCard({ stat, title, body }: { stat: string; title: string; body: string }) {
  return (
    <Card className="lift">
      <div className="font-display text-4xl font-semibold text-terracotta-700">{stat}</div>
      <div className="mt-2 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-ink-700">{body}</p>
    </Card>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
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
