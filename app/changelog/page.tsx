import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Changelog — Sokoni" };

type Entry = {
  date: string;
  version: string;
  type: "feature" | "improvement" | "fix";
  title: string;
  bullets: string[];
};

const CHANGELOG: Entry[] = [
  {
    date: "18 May 2026",
    version: "0.5.0",
    type: "feature",
    title: "Live African commodity map",
    bullets: [
      "Interactive Africa map built on Natural Earth polygons, projected with d3-geo",
      "Click any country to see its tradable commodities, prices, and rank",
      "Pick a commodity to highlight its top African producers with market-share bars",
      "Live price simulation with 24-point sparklines per commodity, streaming every 3.5s"
    ]
  },
  {
    date: "16 May 2026",
    version: "0.4.0",
    type: "feature",
    title: "AfriOrigin wizard, pricing, and developer API",
    bullets: [
      "Three-step compliance wizard: classify → origin determination → savings + Certificate",
      "Pricing page with four tiers (Free / Pro SME / SME Bulk / Forwarder) + per-call API",
      "Developer documentation with sample curl, JSON, and webhook taxonomy",
      "TradeOS architecture diagram naming PAPSS, PACM, ADAPT, and Customs as public rails",
      "i18n scaffolding across English, French, Portuguese, Arabic, and Swahili"
    ]
  },
  {
    date: "14 May 2026",
    version: "0.3.0",
    type: "feature",
    title: "AfCFTA toolkit and Rules of Origin reference",
    bullets: [
      "Tariff calculator with MFN vs preferential rate comparison",
      "Rules of Origin reference by HS chapter",
      "Digital trade document templates aligned with the 2025 AU Digital Trade Protocol"
    ]
  },
  {
    date: "12 May 2026",
    version: "0.2.0",
    type: "feature",
    title: "Marketplace, suppliers, commodities, logistics — roadmap previews",
    bullets: [
      "Marketplace with category filters and AfCFTA-rate preview per listing",
      "KYB-tiered supplier directory (Basic → Platinum)",
      "Pan-African commodity benchmarks with top-producer mapping",
      "Corridor-aware logistics and customs broker directory"
    ]
  },
  {
    date: "10 May 2026",
    version: "0.1.0",
    type: "feature",
    title: "Sokoni v0 — research-backed platform skeleton",
    bullets: [
      "Initial site with research summary and primary sources",
      "Buyer dashboard with PAPSS-savings widget and order tracking",
      "Branding and design system (terracotta / savanna / sand)"
    ]
  }
];

const TYPE_TONE = {
  feature: "terracotta",
  improvement: "info",
  fix: "warn"
} as const;

export default function ChangelogPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-20">
        <Badge tone="terracotta">Changelog</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          What&apos;s new on Sokoni.
        </h1>
        <p className="mt-2 text-ink-700">
          We ship in public. Every meaningful change to the platform is recorded here.
        </p>

        <ol className="mt-10 space-y-8">
          {CHANGELOG.map((e) => (
            <li
              key={e.version}
              className="relative rounded-2xl border border-ink-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={TYPE_TONE[e.type]}>{e.type}</Badge>
                  <span className="font-mono text-xs text-ink-500">v{e.version}</span>
                </div>
                <span className="text-xs text-ink-500">{e.date}</span>
              </div>
              <h2 className="mt-3 font-display text-xl font-semibold">{e.title}</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                {e.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-terracotta-500" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
