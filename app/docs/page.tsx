import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, FileCheck2, Code2 } from "lucide-react";

export const metadata = { title: "Documentation — Sokoni" };

export default function DocsIndex() {
  return (
    <>
      <h1>Sokoni documentation</h1>
      <p>
        Sokoni is the open trade platform for the African Continental Free Trade Area. These docs cover{" "}
        <strong>AfriOrigin</strong> (our compliance product), the public API, and the AfCFTA concepts
        you need to know.
      </p>

      <div className="not-prose mt-8 grid gap-4 sm:grid-cols-2">
        <DocCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Quickstart"
          body="Run your first AfCFTA determination in 60 seconds."
          href="/docs/getting-started"
        />
        <DocCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Rules of Origin"
          body="Wholly Obtained, CTH, Regional Value Content — explained for non-lawyers."
          href="/docs/concepts/rules-of-origin"
        />
        <DocCard
          icon={<FileCheck2 className="h-5 w-5" />}
          title="Certificates"
          body="Generate, validate, and endorse AfCFTA Certificates of Origin."
          href="/docs/afriorigin/certificates"
        />
        <DocCard
          icon={<Code2 className="h-5 w-5" />}
          title="API reference"
          body="Embed AfCFTA compliance in your ERP, freight, or e-commerce platform."
          href="/docs/api"
        />
      </div>

      <h2>What you&apos;ll find here</h2>
      <ul>
        <li><strong>Concepts</strong> — the trade-law bedrock: what AfCFTA is, how preferences work, what PAPSS settles.</li>
        <li><strong>AfriOrigin</strong> — how the product&apos;s three flagship surfaces (classification, origin determination, certificates) actually work.</li>
        <li><strong>API</strong> — every endpoint, sample <code>curl</code>, webhook event, error code, rate limit.</li>
      </ul>

      <h2>Conventions</h2>
      <p>
        All API examples use <code>$SOKONI_API_KEY</code> for authentication. Replace with your live
        key (<code>sk_live_…</code>) or test key (<code>sk_test_…</code>) from the dashboard.
        Currency values are USD unless stated; tariff rates are percentages of FOB value.
      </p>

      <h2>Need help?</h2>
      <p>
        Email <a href="mailto:support@sokoni.africa">support@sokoni.africa</a> for product questions,{" "}
        <a href="mailto:developers@sokoni.africa">developers@sokoni.africa</a> for API issues, or{" "}
        <a href="mailto:security@sokoni.africa">security@sokoni.africa</a> for vulnerability disclosures.
      </p>
    </>
  );
}

function DocCard({
  icon,
  title,
  body,
  href
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-ink-200 bg-white p-5 transition-colors hover:border-terracotta-300 hover:shadow-sm"
    >
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-terracotta-50 text-terracotta-700">
        {icon}
      </div>
      <div className="mt-3 flex items-center gap-1.5 font-semibold text-ink-900">
        {title} <ArrowRight className="h-3.5 w-3.5" />
      </div>
      <p className="mt-1 text-sm text-ink-700">{body}</p>
    </Link>
  );
}
