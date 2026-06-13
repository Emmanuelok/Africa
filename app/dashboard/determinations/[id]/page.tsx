import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Wallet, FileCheck2, Globe2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSessionUser } from "@/lib/server/session";
import { getDetermination } from "@/lib/data/determinations";
import { getCountry } from "@/lib/data/countries";

export const metadata = { title: "Determination — Sokoni" };

export default async function DeterminationDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const d = await getDetermination(user.workspaceId, params.id);
  if (!d) return notFound();

  const origin = getCountry(d.originCountry)?.name ?? d.originCountry;
  const dest = getCountry(d.destinationCountry)?.name ?? d.destinationCountry;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/determinations" className="inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back to determinations
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold md:text-3xl">{d.description}</h1>
          <div className="mt-1 text-sm text-ink-500">{formatDate(d.createdAt)}</div>
        </div>
        <Status status={d.qualifies} />
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric icon={<ShieldCheck className="h-4 w-4" />} label="HS code" value={d.hsCode} mono />
        <Metric
          icon={<Globe2 className="h-4 w-4" />}
          label="Trade lane"
          value={`${flag(d.originCountry)} ${origin} → ${flag(d.destinationCountry)} ${dest}`}
        />
        <Metric icon={<Wallet className="h-4 w-4" />} label="AfCFTA savings" value={formatUsd(d.savingsUsd)} accent />
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold">Tariff breakdown</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Row k="MFN rate" v={`${d.mfnRate}%`} />
          <Row k="AfCFTA preferential rate" v={`${d.afcftaRate}%`} />
          <Row k="FOB value" v={formatUsd(d.fobValueUsd)} />
          <Row k="Quantity" v={d.quantity ? `${d.quantity.toLocaleString()} kg` : "—"} />
          <Row k="Classification confidence" v={`${Math.round(d.confidence * 100)}%`} />
          <Row k="Rule applied" v={d.ruleApplied} />
        </div>
      </Card>

      {d.reasoning && (
        <Card>
          <h2 className="font-display text-lg font-semibold">Origin reasoning</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-ink-700">{d.reasoning}</p>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Generate a Certificate of Origin</h2>
            <p className="mt-1 text-sm text-ink-600">
              {d.qualifies === "no"
                ? "This shipment doesn't qualify, so no preferential certificate applies."
                : "Issue an AfCFTA Certificate of Origin for this determination."}
            </p>
          </div>
          {d.qualifies !== "no" && (
            <Link
              href={`/afriorigin?det=${d.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
            >
              <FileCheck2 className="h-4 w-4" /> Create certificate
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}

function Status({ status }: { status: "yes" | "no" | "marginal" }) {
  if (status === "yes") return <Badge tone="savanna">Qualifies</Badge>;
  if (status === "marginal") return <Badge tone="warn">Marginal</Badge>;
  return <Badge tone="terracotta">Does not qualify</Badge>;
}

function Metric({ icon, label, value, mono, accent }: { icon: React.ReactNode; label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <Card className={accent ? "border-savanna-300 bg-savanna-50/40" : ""}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500">{icon} {label}</div>
      <div className={`mt-2 font-display text-xl font-semibold ${mono ? "font-mono" : ""}`}>{value}</div>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-ink-100 pb-2 text-sm">
      <span className="text-ink-600">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function flag(iso: string) {
  if (!iso || iso.length !== 2) return "";
  return String.fromCodePoint(0x1f1e6 + iso.charCodeAt(0) - 65, 0x1f1e6 + iso.charCodeAt(1) - 65);
}
function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
