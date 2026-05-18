import Link from "next/link";
import { Code2, Key, Webhook, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TradeOSDiagram } from "@/components/TradeOSDiagram";

export const metadata = { title: "Developer API — Sokoni" };

const ENDPOINTS = [
  {
    method: "POST",
    path: "/v1/classify",
    desc: "AI-assisted HS code classification from a free-text product description.",
    price: "$0.10 / call",
    request: `{
  "description": "Premium washed Arabica green coffee beans, AA grade",
  "language": "en"
}`,
    response: `{
  "hs_code": "0901.11",
  "description": "Coffee, not roasted, not decaffeinated",
  "confidence": 0.96,
  "alternates": [
    { "hs_code": "0901.21", "confidence": 0.18 }
  ]
}`
  },
  {
    method: "POST",
    path: "/v1/determine-origin",
    desc: "Run AfCFTA Rules of Origin determination for a shipment.",
    price: "$0.20 / call",
    request: `{
  "hs_code": "0901.11",
  "origin_country": "KE",
  "destination_country": "NG",
  "whole_obtained": true,
  "regional_value_content": null
}`,
    response: `{
  "qualifies": "yes",
  "rule_applied": "Wholly Obtained (Article 5)",
  "reasoning": [
    "Coffee beans in HS 0901 require wholly-obtained status...",
    "Inputs confirmed to originate within Kenya..."
  ],
  "preferential_rate": 2.5,
  "mfn_rate": 12.5
}`
  },
  {
    method: "POST",
    path: "/v1/certificates",
    desc: "Generate an AfCFTA Certificate of Origin (Annex II, Appendix I).",
    price: "$1.50 / cert",
    request: `{
  "determination_id": "det_8H2k...",
  "exporter": {
    "name": "Highlands Coffee Cooperative",
    "address": "Nyeri, Kenya"
  },
  "consignee": {
    "name": "Lagos Roasters Ltd",
    "address": "Apapa, Lagos"
  },
  "shipment": {
    "quantity": 1500,
    "unit": "kg",
    "fob_value_usd": 9300
  }
}`,
    response: `{
  "certificate_id": "cert_K9p4...",
  "reference": "AFCFTA-K9P4XJ02",
  "pdf_url": "https://api.sokoni.africa/certs/cert_K9p4....pdf",
  "issued_at": "2026-05-18T09:14:22Z",
  "qr_verification_url": "https://verify.sokoni.africa/AFCFTA-K9P4XJ02"
}`
  },
  {
    method: "GET",
    path: "/v1/tariff",
    desc: "Look up MFN and AfCFTA preferential rates for any HS code on any lane.",
    price: "$0.02 / call",
    request: `GET /v1/tariff?hs=0901.11&origin=KE&destination=NG`,
    response: `{
  "hs_code": "0901.11",
  "mfn_rate": 12.5,
  "afcfta_rate": 2.5,
  "afcfta_category": "A",
  "phase_down_schedule": {
    "2026": 2.5,
    "2027": 0.0
  }
}`
  }
];

export default function DevelopersPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <Badge tone="terracotta">Developers</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-5xl">
          AfCFTA compliance as an API.
        </h1>
        <p className="mt-3 max-w-3xl text-ink-700">
          Embed Sokoni&apos;s classification, origin determination, and Certificate of Origin
          generation into your ERP, freight platform, or e-commerce checkout. REST, JSON, predictable
          pricing.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <Pill icon={<Key className="h-3.5 w-3.5" />} label="API key auth" />
          <Pill icon={<Webhook className="h-3.5 w-3.5" />} label="Webhooks for state changes" />
          <Pill icon={<GitBranch className="h-3.5 w-3.5" />} label="OpenAPI 3.1 spec" />
          <Pill icon={<Code2 className="h-3.5 w-3.5" />} label="SDKs: Python, TS, Go" />
        </div>

        {/* Quick start */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Quick start</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-ink-200 bg-ink-950 p-6 text-sm text-ink-100">
{`# Authenticate with your API key (header)
export SOKONI_API_KEY="sk_live_..."

# Run a classification + determination + certificate in one call:
curl -X POST https://api.sokoni.africa/v1/shipments \\
  -H "Authorization: Bearer $SOKONI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "AA grade Arabica green coffee beans, 60kg jute bags",
    "origin": "KE",
    "destination": "NG",
    "quantity": 1500,
    "unit": "kg",
    "fob_value_usd": 9300,
    "exporter": { "name": "Highlands Coffee Coop", "address": "Nyeri, Kenya" },
    "consignee": { "name": "Lagos Roasters Ltd", "address": "Apapa, Lagos" },
    "generate_certificate": true
  }'`}
          </pre>
        </section>

        {/* Endpoints */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Endpoints</h2>
          <div className="mt-5 space-y-5">
            {ENDPOINTS.map((e) => (
              <Card key={e.path} className="lift">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-mono font-semibold ${
                        e.method === "GET"
                          ? "bg-savanna-100 text-savanna-800"
                          : "bg-terracotta-100 text-terracotta-800"
                      }`}
                    >
                      {e.method}
                    </span>
                    <code className="font-mono text-sm font-semibold">{e.path}</code>
                  </div>
                  <Badge tone="neutral">{e.price}</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-700">{e.desc}</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <Snippet title="Request" body={e.request} />
                  <Snippet title="Response" body={e.response} />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Webhooks */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Webhooks</h2>
          <p className="mt-2 max-w-3xl text-ink-700">
            Subscribe to lifecycle events so your stack reacts when AfCFTA-bound shipments change
            status — particularly useful for freight forwarders managing many clients.
          </p>
          <Card className="mt-4">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-ink-500">
                <tr><th className="py-2">Event</th><th>Triggered when</th></tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                <tr><td className="py-3 pr-4 font-mono text-xs">classification.completed</td><td className="text-ink-700">An HS classification finishes with a confidence score.</td></tr>
                <tr><td className="py-3 pr-4 font-mono text-xs">determination.qualified</td><td className="text-ink-700">A shipment passes AfCFTA Rules of Origin.</td></tr>
                <tr><td className="py-3 pr-4 font-mono text-xs">determination.rejected</td><td className="text-ink-700">A shipment fails RoO — your system can prompt for re-sourcing.</td></tr>
                <tr><td className="py-3 pr-4 font-mono text-xs">certificate.issued</td><td className="text-ink-700">A Certificate of Origin PDF is ready and signed.</td></tr>
                <tr><td className="py-3 pr-4 font-mono text-xs">certificate.endorsed</td><td className="text-ink-700">National competent authority stamps the e-certificate.</td></tr>
              </tbody>
            </table>
          </Card>
        </section>

        {/* TradeOS section */}
        <section className="mt-16">
          <Badge tone="savanna">Roadmap</Badge>
          <h2 className="mt-3 font-display text-2xl font-semibold md:text-3xl">
            One API today. The TradeOS stack tomorrow.
          </h2>
          <p className="mt-2 max-w-3xl text-ink-700">
            AfriOrigin is module one. Once verified, an SME&apos;s identity, shipment history, and
            buyer relationships unlock the rest of the stack.
          </p>
          <div className="mt-8">
            <TradeOSDiagram />
          </div>
        </section>

        <section className="mt-14 rounded-2xl bg-ink-950 px-6 py-12 text-center text-white md:px-12">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">Get an API key.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-ink-200">
            Free for the first 100 calls. Production traffic is metered, with bulk discounts at 100k+.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/pricing" variant="primary" size="lg">View pricing</Button>
            <Link
              href="mailto:developers@sokoni.africa"
              className="inline-flex items-center gap-2 rounded-lg border border-ink-700 px-6 py-3 text-sm font-medium text-white hover:bg-ink-900"
            >
              Email developers@sokoni.africa
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-ink-700 ring-1 ring-ink-200">
      {icon} {label}
    </span>
  );
}

function Snippet({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-ink-500">{title}</div>
      <pre className="overflow-x-auto rounded-lg border border-ink-200 bg-ink-50 p-3 text-xs text-ink-800">
        <code>{body}</code>
      </pre>
    </div>
  );
}
