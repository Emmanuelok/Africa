import Link from "next/link";
import { Wand2, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getSessionUser } from "@/lib/server/session";
import { listDeterminations } from "@/lib/data/determinations";
import { getCountry } from "@/lib/data/countries";

export const metadata = { title: "Determinations — Sokoni" };

export default async function DeterminationsPage() {
  const user = await getSessionUser();
  const items = await listDeterminations(user.workspaceId);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Determinations</h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/determinations/export"
            className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm font-medium hover:bg-ink-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
          <Button href="/afriorigin" size="md">
            <Wand2 className="h-4 w-4" /> New shipment
          </Button>
        </div>
      </header>

      <Card className="p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-sand-50">
            <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">HS</th>
              <th className="px-4 py-3">Lane</th>
              <th className="px-4 py-3 text-right">FOB</th>
              <th className="px-4 py-3 text-right">Savings</th>
              <th className="px-4 py-3">Rule</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((d) => (
              <tr key={d.id} className="hover:bg-sand-50/60">
                <td className="px-4 py-3 text-xs text-ink-600">{formatDate(d.createdAt)}</td>
                <td className="max-w-[240px] truncate px-4 py-3 font-medium">{d.description}</td>
                <td className="px-4 py-3 font-mono text-xs">{d.hsCode}</td>
                <td className="px-4 py-3 text-xs">
                  {flag(d.originCountry)} {getCountry(d.originCountry)?.name ?? d.originCountry}
                  {" → "}
                  {flag(d.destinationCountry)} {getCountry(d.destinationCountry)?.name ?? d.destinationCountry}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">{formatUsd(d.fobValueUsd)}</td>
                <td className="px-4 py-3 text-right font-mono font-medium text-savanna-700">
                  {formatUsd(d.savingsUsd)}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-xs text-ink-600">
                  {d.ruleApplied}
                </td>
                <td className="px-4 py-3 text-right">
                  <Status status={d.qualifies} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-500">
                  No determinations yet.{" "}
                  <Link href="/afriorigin" className="text-terracotta-700 hover:underline">
                    Run your first one →
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Status({ status }: { status: "yes" | "no" | "marginal" }) {
  if (status === "yes") return <Badge tone="savanna">Qualifies</Badge>;
  if (status === "marginal") return <Badge tone="warn">Marginal</Badge>;
  return <Badge tone="terracotta">No</Badge>;
}
function flag(iso: string) {
  if (!iso || iso.length !== 2) return "";
  return String.fromCodePoint(0x1f1e6 + iso.charCodeAt(0) - 65, 0x1f1e6 + iso.charCodeAt(1) - 65);
}
function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
