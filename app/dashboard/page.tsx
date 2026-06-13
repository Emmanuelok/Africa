import Link from "next/link";
import { ArrowUpRight, ShieldCheck, FileCheck2, TrendingUp, Wallet, Wand2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getSessionUser } from "@/lib/server/session";
import { listDeterminations, listCertificates, workspaceStats } from "@/lib/data/determinations";
import { getCountry } from "@/lib/data/countries";

export const metadata = { title: "Overview — Sokoni" };

export default async function DashboardOverview() {
  const user = await getSessionUser();
  const [determinations, certificates, stats] = await Promise.all([
    listDeterminations(user.workspaceId, 5),
    listCertificates(user.workspaceId, 5),
    workspaceStats(user.workspaceId)
  ]);

  const totalSavings = stats.totalSavingsUsd;
  const totalFob = stats.totalFobUsd;
  const qualifyingPct = stats.determinations
    ? Math.round((stats.qualifying / stats.determinations) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink-500">
            {greet()}, {user.name?.split(" ")[0] ?? "there"}.
          </p>
          <h1 className="font-display text-2xl font-semibold md:text-3xl">Workspace overview</h1>
        </div>
        <Button href="/afriorigin" size="md">
          <Wand2 className="h-4 w-4" /> New shipment
        </Button>
      </header>

      {/* Metric tiles */}
      <div className="grid gap-3 md:grid-cols-4">
        <Metric
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Determinations"
          value={String(stats.determinations)}
          sub="All time"
        />
        <Metric
          icon={<FileCheck2 className="h-4 w-4" />}
          label="Certificates issued"
          value={String(stats.certificates)}
          sub={`${stats.endorsedCertificates} endorsed`}
        />
        <Metric
          icon={<Wallet className="h-4 w-4" />}
          label="AfCFTA savings"
          value={formatUsd(totalSavings)}
          sub={`On ${formatUsd(totalFob)} FOB value`}
          accent
        />
        <Metric
          icon={<TrendingUp className="h-4 w-4" />}
          label="Qualifying rate"
          value={`${qualifyingPct}%`}
          sub="Of shipments meet RoO"
        />
      </div>

      {/* Recent determinations */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent determinations</h2>
          <Link
            href="/dashboard/determinations"
            className="text-sm text-terracotta-700 hover:underline"
          >
            View all <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
                <th className="py-2">Product</th>
                <th className="py-2">HS</th>
                <th className="py-2">Lane</th>
                <th className="py-2 text-right">Savings</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {determinations.slice(0, 5).map((d) => (
                <tr key={d.id} className="hover:bg-sand-50/60">
                  <td className="max-w-[260px] truncate py-3 font-medium">{d.description}</td>
                  <td className="py-3 font-mono text-xs text-ink-600">{d.hsCode}</td>
                  <td className="py-3 text-xs text-ink-700">
                    {flag(d.originCountry)} {getCountry(d.originCountry)?.name ?? d.originCountry}
                    {" → "}
                    {flag(d.destinationCountry)} {getCountry(d.destinationCountry)?.name ?? d.destinationCountry}
                  </td>
                  <td className="py-3 text-right font-mono font-medium text-savanna-700">
                    {formatUsd(d.savingsUsd)}
                  </td>
                  <td className="py-3 text-right">
                    <StatusBadge status={d.qualifies} />
                  </td>
                </tr>
              ))}
              {determinations.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-ink-500">
                    No determinations yet.{" "}
                    <Link href="/afriorigin" className="text-terracotta-700 hover:underline">
                      Run your first one →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Two-up: Certificates + Plan usage */}
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Latest certificates</h2>
            <Link
              href="/dashboard/certificates"
              className="text-sm text-terracotta-700 hover:underline"
            >
              View all <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {certificates.slice(0, 4).map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-ink-100 bg-white p-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs font-medium text-ink-900">
                    {c.reference}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-ink-600">
                    {c.exporterName} → {c.consigneeName}
                  </div>
                </div>
                {c.endorsedByAuthority ? (
                  <Badge tone="savanna">Endorsed</Badge>
                ) : (
                  <Badge tone="warn">Pending</Badge>
                )}
              </li>
            ))}
            {certificates.length === 0 && (
              <li className="rounded-lg border border-dashed border-ink-300 p-4 text-center text-sm text-ink-500">
                No certificates yet.
              </li>
            )}
          </ul>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold">Plan & usage</h2>
          <div className="mt-4 space-y-3 text-sm">
            <UsageRow label="Plan" value={user.plan.toUpperCase()} />
            <UsageRow label="Determinations" value={`${stats.determinations} / ${user.plan === "free" ? "1/mo" : "∞"}`} />
            <UsageRow
              label="Certificates issued"
              value={`${stats.certificates} / ${planLimit(user.plan)}`}
            />
            <UsageRow label="Languages enabled" value="5" />
          </div>
          <div className="mt-5 flex gap-2">
            <Button href="/dashboard/billing" variant="outline" size="sm">
              Manage billing
            </Button>
            <Button href="/pricing" variant="ghost" size="sm">
              Compare plans <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  accent
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-savanna-300 bg-savanna-50/40" : ""}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500">
        {icon} {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-ink-600">{sub}</div>
    </Card>
  );
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-600">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "yes" | "no" | "marginal" }) {
  if (status === "yes") return <Badge tone="savanna">Qualifies</Badge>;
  if (status === "marginal") return <Badge tone="warn">Marginal</Badge>;
  return <Badge tone="terracotta">No</Badge>;
}

function flag(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + iso2.charCodeAt(0) - 65, A + iso2.charCodeAt(1) - 65);
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function greet(): string {
  const h = new Date().getUTCHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function planLimit(plan: string): string {
  return plan === "forwarder" ? "∞" : plan === "bulk" ? "25" : plan === "pro" ? "5" : "0";
}
