import Link from "next/link";
import { ShieldCheck, Clock, Star } from "lucide-react";
import { SUPPLIERS } from "@/lib/data/suppliers";
import { getCountry } from "@/lib/data/countries";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/utils";

export const metadata = { title: "Suppliers — Sokoni" };

export default function SuppliersPage() {
  const verified = SUPPLIERS.filter((s) => s.verified).length;
  const platinum = SUPPLIERS.filter((s) => s.kybLevel === "Platinum").length;

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <Badge tone="terracotta">Suppliers</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">Verified African exporters</h1>
        <p className="mt-2 max-w-2xl text-ink-600">
          Every supplier is KYB-verified against national company registries. AfCFTA-Approved Exporter
          status lets them self-declare origin without per-shipment certificates.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Total suppliers" value={SUPPLIERS.length} />
          <Stat label="KYB verified" value={verified} />
          <Stat label="Platinum tier" value={platinum} />
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {SUPPLIERS.map((s) => {
            const country = getCountry(s.country);
            return (
              <Card key={s.id} className="lift">
                <div id={s.id} />
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-terracotta-50 text-2xl font-semibold text-terracotta-700">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{s.name}</h3>
                      <Badge tone={tone(s.kybLevel)}>
                        <ShieldCheck className="h-3 w-3" /> {s.kybLevel}
                      </Badge>
                      {s.afcftaApproved && <Badge tone="info">AfCFTA Approved</Badge>}
                    </div>
                    <div className="mt-1 text-sm text-ink-600">
                      {country?.flag} {s.city}, {country?.name} · Est. {s.founded} · {s.employees}
                    </div>
                    <p className="mt-3 text-sm text-ink-700">{s.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.categories.map((c) => (
                        <Badge key={c} tone="sand">{c}</Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-600">
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> {s.rating}</span>
                      <span>{formatNumber(s.ordersFulfilled)} orders</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> ~{s.responseHrs}h reply</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 border-t border-ink-100 pt-4 text-sm">
                  <Link href="/marketplace" className="font-medium text-terracotta-700 hover:underline">
                    View listings →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function tone(level: string) {
  if (level === "Platinum") return "savanna" as const;
  if (level === "Gold") return "sand" as const;
  return "neutral" as const;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}
