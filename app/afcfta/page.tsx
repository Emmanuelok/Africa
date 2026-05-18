import { ROO_CRITERIA } from "@/lib/data/tariffs";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { TariffCalculator } from "@/components/TariffCalculator";
import { FileCheck2, BookOpen, ShieldCheck, FileText, ScrollText } from "lucide-react";

export const metadata = { title: "AfCFTA Toolkit — Sokoni" };

const DOCS = [
  { name: "Certificate of Origin (Annex II, Appendix I)", desc: "Standardized AfCFTA CoO accepted across all State Parties.", icon: FileCheck2 },
  { name: "Commercial invoice", desc: "Incoterms 2020-compliant, multi-currency, PAPSS-routable.", icon: FileText },
  { name: "Packing list", desc: "WCO data-model aligned, accepted by ASYCUDA-based customs.", icon: ScrollText },
  { name: "Origin declaration (Approved Exporter)", desc: "Self-declaration for AfCFTA-approved frequent exporters.", icon: ShieldCheck }
];

export default function AfcftaPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <Badge tone="terracotta">AfCFTA toolkit</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          Make AfCFTA preferences actually work for your shipment
        </h1>
        <p className="mt-2 max-w-3xl text-ink-600">
          The AfCFTA Agreement liberalizes 90% of tariff lines. But preferences only apply if your
          goods qualify under the Rules of Origin and you file the right documents. This toolkit
          handles both.
        </p>

        <div id="tariff" className="mt-10">
          <TariffCalculator />
        </div>

        <section id="rules" className="mt-12">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-terracotta-700" />
            <h2 className="font-display text-2xl font-semibold">Rules of Origin — at a glance</h2>
          </div>
          <p className="mt-2 max-w-3xl text-ink-600">
            Origin determines whether you get the AfCFTA preferential rate. The rule depends on the HS
            chapter of your product — most agricultural goods qualify via &ldquo;wholly obtained&rdquo;,
            while industrial goods require change of tariff heading or regional value content.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {ROO_CRITERIA.map((r) => (
              <Card key={r.hsChapter} className="lift">
                <Badge tone="sand">{r.hsChapter}</Badge>
                <h3 className="mt-3 font-semibold">{r.rule}</h3>
                <p className="mt-2 text-sm text-ink-700">{r.example}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-terracotta-700" />
            <h2 className="font-display text-2xl font-semibold">Digital trade documents</h2>
          </div>
          <p className="mt-2 max-w-3xl text-ink-600">
            Per the AU&apos;s 2025 Digital Trade Protocol, all State Parties must accept electronic
            documents and e-signatures. Sokoni generates each of the below in formats your destination
            customs authority will accept.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {DOCS.map((d) => (
              <Card key={d.name} className="lift">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-savanna-50 text-savanna-700">
                    <d.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{d.name}</h3>
                    <p className="mt-1 text-sm text-ink-700">{d.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <Card className="bg-ink-950 text-white">
            <h3 className="font-display text-xl font-semibold">AfCFTA at a glance — May 2026</h3>
            <div className="mt-5 grid gap-6 md:grid-cols-4">
              <Mini label="State Parties" value="48 ratified" sub="of 54 AU members" />
              <Mini label="Liberalized lines" value="90%" sub="Categories A + B" />
              <Mini label="Sensitive (Cat C)" value="3%" sub="Excluded from liberalization" />
              <Mini label="PAPSS-live members" value="13" sub="With 4 in onboarding" />
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
      <div className="text-xs text-ink-300">{sub}</div>
    </div>
  );
}
