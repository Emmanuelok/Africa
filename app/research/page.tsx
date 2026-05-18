import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ExternalLink } from "lucide-react";

export const metadata = { title: "Research — Sokoni" };

const SOURCES = [
  {
    title: "Non-Tariff Barriers: The Invisible Wall Stifling AfCFTA Trade (2026)",
    org: "Business Tech Africa",
    url: "https://www.businesstechafrica.co.za/business/trade-and-commerce/2026/03/02/non-tariff-barriers-the-invisible-wall-stifling-afcfta-trade/"
  },
  {
    title: "AfCFTA Framework Implementation Pain Points — Abidjan-Lagos Corridor",
    org: "CARISCA, KNUST",
    url: "https://carisca.knust.edu.gh/afcfta-framework-implementation-pain-points-insights-from-the-abidjan-lagos-trade-corridor/"
  },
  {
    title: "AfCFTA scorecard after five years",
    org: "africa.com",
    url: "https://africa.com/afcftas-scorecard-after-five-years/"
  },
  {
    title: "Turning AfCFTA into reality for SMEs in Africa",
    org: "United Nations Development Programme",
    url: "https://www.undp.org/africa/blog/turning-african-continental-free-trade-area-afcfta-reality-small-and-mid-sized-businesses-africa"
  },
  {
    title: "Pesalink & PAPSS unlock cross-border payments in local currencies in Kenya",
    org: "African Export-Import Bank",
    url: "https://www.afreximbank.com/pesalink-and-papss-unlock-cross-border-payments-in-local-currencies-in-kenya/"
  },
  {
    title: "Pan-African Payment and Settlement System",
    org: "U.S. International Trade Administration",
    url: "https://www.trade.gov/market-intelligence/pan-african-payment-and-settlement-system"
  },
  {
    title: "PAPSS at Project FASTT",
    org: "World Bank",
    url: "https://fastpayments.worldbank.org/node/373"
  },
  {
    title: "International e-Commerce in Africa: The Way Forward",
    org: "International Trade Centre",
    url: "https://www.intracen.org/file/internationalecommerceinafricalowrespdf"
  },
  {
    title: "Digital Marketplaces and Intra-African Trade",
    org: "United Nations Development Programme",
    url: "https://www.undp.org/ghana/publications/digital-marketplaces-and-intra-african-trade"
  },
  {
    title: "AfCFTA Rules of Origin Manual",
    org: "African Union",
    url: "https://au.int/sites/default/files/documents/42397-doc-AfCFTA_RULES_OF_ORIGIN_MANUAL.pdf"
  },
  {
    title: "AfCFTA Digital Trade Protocol — clarification of key issues",
    org: "tralac",
    url: "https://www.tralac.org/blog/article/16325-the-afcfta-digital-trade-protocol-clarification-of-key-issues.html"
  },
  {
    title: "AfCFTA Digital Trade Protocol",
    org: "U.S. International Trade Administration",
    url: "https://www.trade.gov/market-intelligence/afcfta-digital-trade-protocol"
  }
];

const FINDINGS = [
  {
    n: "16-17%",
    title: "Intra-African trade share",
    body: "Persistent ceiling over the last decade. Asia trades 59% within Asia; Europe 68% within Europe."
  },
  {
    n: "18-300%",
    title: "Non-tariff barrier tariff-equivalent",
    body: "Depending on sector and corridor. Licensing regimes, phytosanitary, port handling and roadblocks dominate."
  },
  {
    n: "29%",
    title: "Road transport in final price",
    body: "Versus ~7% globally. Multiple corridor checkpoints and overlapping customs add days and cost."
  },
  {
    n: "80%+",
    title: "Payments via offshore correspondents",
    body: "Most intra-African transfers still clear in USD/EUR via banks in London or New York, with fees up to 10%."
  },
  {
    n: "15%",
    title: "SSA SMEs in international trade",
    body: "Existing platforms exclude or under-serve African SMEs; informal cross-border trade dominates."
  },
  {
    n: "13",
    title: "Countries with PAPSS commercial banks live",
    body: "From 15 central-bank signatories. Tunisia, Comoros, Uganda, Egypt now in onboarding (Feb 2026)."
  },
  {
    n: "Feb 2025",
    title: "AfCFTA Digital Trade Protocol annexes adopted",
    body: "Including Rules of Origin for digital goods. States must accept e-documents and e-signatures."
  }
];

export default function ResearchPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <Badge tone="terracotta">Research</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          Why a unified African trade platform is overdue
        </h1>
        <p className="mt-3 text-ink-700">
          The AfCFTA went into force in 2021. Five years on, the headline 90%-of-tariff-lines
          liberalization hasn&apos;t translated into proportional intra-African trade growth. This
          page summarizes the evidence base behind Sokoni&apos;s design choices.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Key findings</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {FINDINGS.map((f) => (
              <Card key={f.title} className="lift">
                <div className="font-display text-3xl font-semibold text-terracotta-700">{f.n}</div>
                <div className="mt-1 font-semibold">{f.title}</div>
                <p className="mt-2 text-sm text-ink-700">{f.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Design implications for Sokoni</h2>
          <ol className="mt-5 space-y-4">
            {[
              ["Discovery and trust must be solved together.", "KYB verification is a precondition for SMEs to risk a cross-border counterparty — Alibaba-style listing alone won't move volume."],
              ["Payments are the choke point — bet on PAPSS.", "Where PAPSS is live, transactions settle in local currency in seconds. Where it isn't, fall back to vetted bank rails with cost transparency."],
              ["The AfCFTA preferential rate has to be visible at the point of decision.", "Most traders don't realize they qualify; show MFN vs. AfCFTA on every listing and on every quote."],
              ["Logistics must be corridor-aware, not generic.", "Abidjan-Lagos differs from Mombasa-Kigali differs from Durban-Lubumbashi. Forwarder match must reflect that."],
              ["Documents are the silent killer.", "Documentation errors are the #1 cause of held containers. Generate WCO-compliant e-docs, validated against destination requirements."],
              ["SME-first, not enterprise-first.", "The 85% of SSA SMEs not currently in international trade are the market. Free listings, no minimum revenue gates, multi-language by default."]
            ].map(([head, body], i) => (
              <li key={i} className="rounded-2xl border border-ink-200 bg-white p-5">
                <div className="text-xs font-mono uppercase tracking-wider text-terracotta-700">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-1 font-semibold">{head}</div>
                <p className="mt-1 text-sm text-ink-700">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Sources</h2>
          <ul className="mt-4 space-y-2">
            {SOURCES.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-start gap-2 text-sm text-ink-800 hover:text-terracotta-700"
                >
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400 group-hover:text-terracotta-700" />
                  <span>
                    <span className="underline-offset-2 group-hover:underline">{s.title}</span>
                    <span className="text-ink-500"> — {s.org}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
