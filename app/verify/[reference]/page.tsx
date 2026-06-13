import Link from "next/link";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import {
  ShieldCheck,
  ShieldX,
  Download,
  ExternalLink,
  Globe2,
  FileCheck2,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getDb, schema } from "@/lib/db/client";
import { DEMO_CERTIFICATES, DEMO_DETERMINATIONS } from "@/lib/data/demo-store";
import { getCountry } from "@/lib/data/countries";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// Public, unauthenticated route. The reference space is high-entropy
// (AFCFTA-XXXXXXXX over 32 chars) so enumeration isn't practical, but we still
// throttle per IP to protect the database from a hammering attack.
function clientIp(): string {
  const h = headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
}

type VerifiedCert = {
  reference: string;
  issuedAt: string;
  hsCode: string;
  description: string;
  originCountry: string;
  destinationCountry: string;
  exporterName: string;
  consigneeName: string;
  ruleApplied: string;
  preferentialRate: number | null;
  endorsedByAuthority: boolean;
  workspaceName: string;
  pdfId: string | null;
  revoked: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
};

async function resolve(reference: string): Promise<VerifiedCert | null> {
  // Demo lookup
  const demo = DEMO_CERTIFICATES.find((c) => c.reference === reference);
  if (demo) {
    const det = DEMO_DETERMINATIONS.find((d) => d.id === demo.determinationId);
    return {
      reference: demo.reference,
      issuedAt: demo.createdAt,
      hsCode: demo.hsCode,
      description: det?.description ?? "—",
      originCountry: demo.originCountry,
      destinationCountry: demo.destinationCountry,
      exporterName: demo.exporterName,
      consigneeName: demo.consigneeName,
      ruleApplied: det?.ruleApplied ?? "—",
      preferentialRate: det?.afcftaRate ?? null,
      endorsedByAuthority: demo.endorsedByAuthority,
      workspaceName: "Highlands Coffee Cooperative",
      pdfId: demo.id,
      revoked: false,
      revokedAt: null,
      revokedReason: null
    };
  }

  const db = getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(schema.certificates)
    .where(eq(schema.certificates.reference, reference))
    .limit(1);
  const cert = rows[0];
  if (!cert) return null;

  let det: typeof schema.determinations.$inferSelect | undefined;
  if (cert.determinationId) {
    const dets = await db
      .select()
      .from(schema.determinations)
      .where(eq(schema.determinations.id, cert.determinationId))
      .limit(1);
    det = dets[0];
  }

  let workspaceName = "—";
  if (cert.workspaceId) {
    const wsRows = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, cert.workspaceId))
      .limit(1);
    if (wsRows[0]) workspaceName = wsRows[0].name;
  }

  return {
    reference: cert.reference,
    issuedAt: cert.createdAt.toISOString(),
    hsCode: det?.hsCode ?? "—",
    description: det?.description ?? "—",
    originCountry: det?.originCountry ?? "",
    destinationCountry: det?.destinationCountry ?? "",
    exporterName: cert.exporterName ?? "—",
    consigneeName: cert.consigneeName ?? "—",
    ruleApplied: det?.ruleApplied ?? "—",
    preferentialRate: det?.afcftaRate ? Number(det.afcftaRate) : null,
    endorsedByAuthority: cert.endorsedByAuthority,
    workspaceName,
    pdfId: cert.id,
    revoked: !!cert.revokedAt,
    revokedAt: cert.revokedAt?.toISOString() ?? null,
    revokedReason: cert.revokedReason ?? null
  };
}

export async function generateMetadata({ params }: { params: { reference: string } }) {
  return {
    title: `Verify ${params.reference} — Sokoni`,
    description: "Public verification of an AfCFTA Certificate of Origin issued via Sokoni.",
    robots: { index: false, follow: false } // never index verification pages
  };
}

export default async function VerifyPage({ params }: { params: { reference: string } }) {
  // 30 lookups / minute / IP — generous for a customs officer scanning a
  // batch, restrictive enough to deter scraping. No-op without Upstash.
  const rl = await rateLimit(`verify:${clientIp()}`, "classify");
  if (!rl.success) {
    return (
      <div className="bg-pattern">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6 md:py-24">
          <h1 className="font-display text-2xl font-semibold">Too many requests</h1>
          <p className="mt-2 text-ink-700">
            You&apos;ve made a lot of verification requests. Wait a minute and try again.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-terracotta-700 hover:underline">
            Back to sokoni.africa →
          </Link>
        </div>
      </div>
    );
  }

  const cert = await resolve(params.reference);

  if (!cert) {
    return (
      <div className="bg-pattern">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6 md:py-24">
          <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-terracotta-50 text-terracotta-700">
            <ShieldX className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold">Not a Sokoni certificate</h1>
          <p className="mt-2 text-ink-700">
            Reference{" "}
            <code className="font-mono text-sm bg-ink-100 px-1.5 py-0.5 rounded">{params.reference}</code>{" "}
            isn&apos;t in our records. Either it was issued elsewhere, has been revoked, or
            you&apos;ve mistyped the reference.
          </p>
          <p className="mt-4 text-sm text-ink-600">
            If you scanned this from a printed certificate, verify the reference on the page matches
            the one above. Sokoni references always start with <code>AFCFTA-</code>.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm font-medium text-terracotta-700 hover:underline"
          >
            Back to sokoni.africa →
          </Link>
        </div>
      </div>
    );
  }

  const originName = getCountry(cert.originCountry)?.name ?? cert.originCountry;
  const destName = getCountry(cert.destinationCountry)?.name ?? cert.destinationCountry;
  const issueDate = new Date(cert.issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  if (cert.revoked) {
    return (
      <div className="bg-pattern">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <div className="rounded-2xl border-2 border-terracotta-400 bg-terracotta-50/60 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-terracotta-600 text-white">
                <ShieldX className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <Badge tone="terracotta">Revoked · Do not accept</Badge>
                <h1 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
                  This certificate has been revoked
                </h1>
                <code className="mt-1 inline-block font-mono text-sm font-medium text-terracotta-700">
                  {cert.reference}
                </code>
                <p className="mt-3 text-sm text-ink-700">
                  Issued by <strong>{cert.workspaceName}</strong> and subsequently <strong>revoked</strong>
                  {cert.revokedAt && (
                    <> on {new Date(cert.revokedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</>
                  )}
                  . It is no longer valid and must not be used to claim AfCFTA preferential treatment.
                </p>
                {cert.revokedReason && (
                  <p className="mt-2 text-sm text-ink-700">
                    <strong>Reason given:</strong> {cert.revokedReason}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 rounded-xl border border-ink-200 bg-white p-4 text-xs text-ink-600">
            <strong className="text-ink-900">For customs officers:</strong> a revoked certificate
            should be rejected. If you believe this is an error, contact the issuing exporter, who
            can issue a fresh certificate with a new reference.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <div className={`rounded-2xl border-2 p-6 md:p-8 ${
          cert.endorsedByAuthority
            ? "border-savanna-400 bg-savanna-50/60"
            : "border-amber-300 bg-amber-50/60"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${
              cert.endorsedByAuthority ? "bg-savanna-600 text-white" : "bg-amber-500 text-white"
            }`}>
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <Badge tone={cert.endorsedByAuthority ? "savanna" : "warn"}>
                {cert.endorsedByAuthority ? "Verified · Endorsed" : "Verified · Pending endorsement"}
              </Badge>
              <h1 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
                AfCFTA Certificate of Origin
              </h1>
              <code className="mt-1 inline-block font-mono text-sm font-medium text-terracotta-700">
                {cert.reference}
              </code>
              <p className="mt-3 text-sm text-ink-700">
                Issued by <strong>{cert.workspaceName}</strong> via Sokoni. This reference matches an
                authentic certificate generated under the AfCFTA Protocol on Trade in Goods,
                Annex II, Appendix I format.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500">
              <Globe2 className="h-3 w-3" /> Trade lane
            </div>
            <div className="mt-2 font-display text-lg font-semibold">
              {flag(cert.originCountry)} {originName}
              <span className="mx-2 text-ink-400">→</span>
              {flag(cert.destinationCountry)} {destName}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500">
              <Calendar className="h-3 w-3" /> Issued
            </div>
            <div className="mt-2 font-display text-lg font-semibold">{issueDate}</div>
          </Card>

          <Card className="md:col-span-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500">
              <FileCheck2 className="h-3 w-3" /> Goods
            </div>
            <div className="mt-2 text-sm">{cert.description}</div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-ink-600">HS:</span>
              <code className="font-mono font-medium">{cert.hsCode}</code>
              <span className="text-ink-300">·</span>
              <span className="text-ink-600">Origin rule:</span>
              <span className="font-medium">{cert.ruleApplied}</span>
              {cert.preferentialRate != null && (
                <>
                  <span className="text-ink-300">·</span>
                  <span className="text-ink-600">Preferential rate:</span>
                  <span className="font-medium">{cert.preferentialRate}%</span>
                </>
              )}
            </div>
          </Card>

          <Card>
            <div className="text-xs uppercase tracking-wide text-ink-500">Exporter</div>
            <div className="mt-1 text-base font-semibold">{cert.exporterName}</div>
          </Card>

          <Card>
            <div className="text-xs uppercase tracking-wide text-ink-500">Consignee</div>
            <div className="mt-1 text-base font-semibold">{cert.consigneeName}</div>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {cert.pdfId && (
            <a
              href={`/api/certificates/${cert.pdfId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
          )}
          <Link
            href="/docs/concepts/afcfta"
            className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-4 py-2 text-sm font-medium hover:bg-ink-50"
          >
            What is AfCFTA? <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-12 rounded-xl border border-ink-200 bg-white p-4 text-xs text-ink-600">
          <strong className="text-ink-900">For customs officers:</strong> This verification confirms
          the reference matches a Sokoni-issued certificate, the data is intact, and (when marked
          Endorsed) the certificate has been electronically signed by a national competent authority
          under the AU Digital Trade Protocol (2025), Article 6. Final acceptance remains at the
          discretion of the receiving customs authority.
        </div>
      </div>
    </div>
  );
}

function flag(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "";
  return String.fromCodePoint(0x1f1e6 + iso2.charCodeAt(0) - 65, 0x1f1e6 + iso2.charCodeAt(1) - 65);
}
