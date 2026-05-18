import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ShieldCheck, Lock, FileCheck2, Server, Eye, AlertTriangle } from "lucide-react";

export const metadata = { title: "Security — Sokoni" };

export default function SecurityPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-20">
        <Badge tone="savanna">Security</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          How we protect your trade data.
        </h1>
        <p className="mt-3 max-w-2xl text-ink-700">
          Cross-border trade carries sensitive commercial data — shipment values, customer
          relationships, supplier contracts. Sokoni&apos;s security posture is built for the
          B2B procurement bar from day one.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card>
            <Icon><Lock className="h-5 w-5" /></Icon>
            <h2 className="mt-3 font-semibold">Encryption everywhere</h2>
            <p className="mt-1 text-sm text-ink-700">
              TLS 1.3 in transit. AES-256 at rest for the database, certificate PDFs, and any
              uploaded KYB documents. Encryption keys are managed in AWS KMS / GCP KMS with
              quarterly rotation.
            </p>
          </Card>

          <Card>
            <Icon><Server className="h-5 w-5" /></Icon>
            <h2 className="mt-3 font-semibold">Data residency in Africa</h2>
            <p className="mt-1 text-sm text-ink-700">
              Production data resides in AWS af-south-1 (Cape Town) and GCP africa-south1
              (Johannesburg). Backups stay within the continent. Optional EU-region deployment
              for customers with EU data-residency contracts.
            </p>
          </Card>

          <Card>
            <Icon><Eye className="h-5 w-5" /></Icon>
            <h2 className="mt-3 font-semibold">Least-privilege access</h2>
            <p className="mt-1 text-sm text-ink-700">
              SSO + MFA mandatory for all Sokoni staff. Production access requires named-engineer
              break-glass with audit logging. No vendor or contractor has standing production
              access.
            </p>
          </Card>

          <Card>
            <Icon><FileCheck2 className="h-5 w-5" /></Icon>
            <h2 className="mt-3 font-semibold">Compliance roadmap</h2>
            <p className="mt-1 text-sm text-ink-700">
              SOC 2 Type I audit underway (target Q4 2026), Type II to follow. ISO 27001 in
              parallel. POPIA, NDPA (Nigeria), KDPA (Kenya), and GDPR mappings live today —
              available on request.
            </p>
          </Card>

          <Card>
            <Icon><AlertTriangle className="h-5 w-5" /></Icon>
            <h2 className="mt-3 font-semibold">Incident response</h2>
            <p className="mt-1 text-sm text-ink-700">
              24/7 on-call rotation, paging on critical alerts. Customers are notified within
              72 hours of a confirmed data incident (faster where law requires). Post-mortems
              published to <a href="/status" className="text-terracotta-700 hover:underline">/status</a>.
            </p>
          </Card>

          <Card>
            <Icon><ShieldCheck className="h-5 w-5" /></Icon>
            <h2 className="mt-3 font-semibold">Independent testing</h2>
            <p className="mt-1 text-sm text-ink-700">
              External penetration testing annually plus a public vulnerability disclosure programme.
              Email <a href="mailto:security@sokoni.africa" className="text-terracotta-700 hover:underline">security@sokoni.africa</a> with findings; we acknowledge within 24 hours.
            </p>
          </Card>
        </div>

        <Card className="mt-10">
          <h2 className="font-semibold">Sub-processors</h2>
          <p className="mt-1 text-sm text-ink-700">
            Updated whenever sub-processors change. Customers on annual contracts receive 30-day
            advance notice of additions.
          </p>
          <ul className="mt-4 grid gap-2 text-sm md:grid-cols-2">
            <Sub name="Vercel" use="App hosting (web + edge)" region="Global, AF preference" />
            <Sub name="AWS" use="Database & object storage" region="af-south-1 (Cape Town)" />
            <Sub name="Stripe / Paystack / Flutterwave" use="Payments" region="Per processor" />
            <Sub name="Resend" use="Transactional email" region="EU" />
            <Sub name="Anthropic" use="AI HS classification" region="US / EU" />
            <Sub name="Sentry" use="Error monitoring" region="EU" />
          </ul>
        </Card>

        <div className="mt-10 rounded-2xl bg-ink-950 p-6 text-center text-white md:p-10">
          <h2 className="font-display text-2xl font-semibold">Security questions for procurement?</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink-200">
            We respond to security questionnaires (SIG, CAIQ) within 5 business days. DPAs and
            standard contractual clauses are available pre-signed.
          </p>
          <a
            href="mailto:security@sokoni.africa"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta-600 px-6 py-3 text-sm font-medium text-white hover:bg-terracotta-700"
          >
            Email security@sokoni.africa
          </a>
        </div>
      </div>
    </div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-lg bg-savanna-50 text-savanna-700">
      {children}
    </div>
  );
}

function Sub({ name, use, region }: { name: string; use: string; region: string }) {
  return (
    <li className="rounded-lg border border-ink-200 bg-white p-3">
      <div className="font-semibold">{name}</div>
      <div className="text-xs text-ink-500">{use} · {region}</div>
    </li>
  );
}
