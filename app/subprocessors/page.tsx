import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Sub-processors — Sokoni",
  description: "The third-party sub-processors Sokoni uses to deliver the AfriOrigin platform."
};

type Sub = {
  name: string;
  purpose: string;
  location: string;
  data: string;
};

const SUBPROCESSORS: Sub[] = [
  { name: "Vercel", purpose: "Application hosting (web + edge + serverless functions)", location: "Global, Africa-preferred regions", data: "All request data in transit" },
  { name: "Neon / AWS RDS", purpose: "Primary Postgres database", location: "AWS af-south-1 (Cape Town) / eu-central-1", data: "Account, workspace, trade, KYB metadata" },
  { name: "AWS S3 / Vercel Blob", purpose: "Certificate PDF storage", location: "af-south-1 / global edge", data: "Generated Certificates of Origin" },
  { name: "Upstash", purpose: "Rate limiting, caching, background job queue (QStash)", location: "Global, EU/US regions", data: "Ephemeral keys, cached classifications, job payloads" },
  { name: "Anthropic", purpose: "AI HS classification", location: "US / EU", data: "Product descriptions submitted for classification" },
  { name: "Stripe", purpose: "Card payments + tax", location: "US / EU / global", data: "Billing contact, payment method, tax ID" },
  { name: "Paystack", purpose: "African card + bank payments", location: "Nigeria / pan-African", data: "Billing contact, payment method" },
  { name: "Flutterwave", purpose: "Mobile money + card payments", location: "Pan-African", data: "Billing contact, payment method" },
  { name: "Resend", purpose: "Transactional email", location: "EU / US", data: "Recipient email, message content" },
  { name: "Smile Identity", purpose: "KYB / business verification", location: "Pan-African", data: "Business registration details (paid tiers only)" },
  { name: "Sentry", purpose: "Error monitoring", location: "EU", data: "Error metadata, request IDs (PII scrubbed)" },
  { name: "Cloudflare", purpose: "Turnstile CAPTCHA on public forms", location: "Global edge", data: "IP address, challenge token" }
];

export default function SubprocessorsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Sub-processors" lastUpdated="13 June 2026">
      <p>
        Sokoni engages the third parties below to process Personal Data in delivering the AfriOrigin
        platform. Each is bound by a data processing agreement no less protective than our{" "}
        <a href="/dpa">DPA</a>. We give at least 30 days&apos; notice of additions or replacements;
        customers on annual plans are notified by email.
      </p>
      <p>
        Several entries are alternatives selected per deployment (for example, the database may be
        Neon or AWS RDS; payments route through whichever processor matches the customer&apos;s
        country). Only services actually configured for a given workspace process that
        workspace&apos;s data.
      </p>

      <table>
        <thead>
          <tr>
            <th>Sub-processor</th>
            <th>Purpose</th>
            <th>Location</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {SUBPROCESSORS.map((s) => (
            <tr key={s.name}>
              <td><strong>{s.name}</strong></td>
              <td>{s.purpose}</td>
              <td>{s.location}</td>
              <td>{s.data}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Notifications</h2>
      <p>
        To be notified of changes to this list, email{" "}
        <a href="mailto:dpo@sokoni.africa">dpo@sokoni.africa</a> with the subject line
        &ldquo;subprocessor notifications&rdquo;.
      </p>
    </LegalPage>
  );
}
