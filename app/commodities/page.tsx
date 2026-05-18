import { COMMODITIES } from "@/lib/data/commodities";
import { getCountry } from "@/lib/data/countries";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { AfricaMap } from "@/components/AfricaMap";

export const metadata = { title: "Live Africa Commodity Map — Sokoni" };

const CATEGORIES: Array<"Agriculture" | "Soft" | "Metals" | "Energy"> = [
  "Agriculture",
  "Soft",
  "Metals",
  "Energy"
];

export default function CommoditiesPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <Badge tone="terracotta">Live map</Badge>
            <h1 className="mt-3 font-display text-3xl font-semibold md:text-5xl">
              The African Trade Map.
            </h1>
            <p className="mt-2 max-w-2xl text-ink-700">
              Every African state, every tradable commodity, every price — in one view. Click a
              country to see what it produces. Pick a commodity to see who exports it. Prices update
              live every 3.5 seconds.
            </p>
          </div>
          <Badge tone="info" className="hidden md:inline-flex">
            Geometry: Natural Earth (public domain)
          </Badge>
        </div>

        {/* THE MAP */}
        <div className="mt-8">
          <AfricaMap />
        </div>

        {/* Tabular view below */}
        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold">Commodity benchmarks</h2>
          <p className="mt-1 text-sm text-ink-600">
            Indicative continental prices. Production rollout pulls from Refinitiv, S&amp;P Global
            Platts, and national commodity exchanges (ECX, GCX, JSE).
          </p>

          {CATEGORIES.map((cat) => {
            const items = COMMODITIES.filter((c) => c.category === cat);
            if (items.length === 0) return null;
            return (
              <section key={cat} className="mt-8">
                <h3 className="font-display text-lg font-semibold">{cat}</h3>
                <div className="mt-3 overflow-hidden rounded-2xl border border-ink-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Commodity</th>
                        <th className="px-4 py-3 font-medium">HS code</th>
                        <th className="px-4 py-3 font-medium text-right">Price (USD)</th>
                        <th className="px-4 py-3 font-medium text-right">24h</th>
                        <th className="px-4 py-3 font-medium">Top African producers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {items.map((c) => {
                        const up = c.change24h >= 0;
                        return (
                          <tr key={c.symbol} className="hover:bg-sand-50/40">
                            <td className="px-4 py-3">
                              <div className="font-medium">{c.name}</div>
                              <div className="text-xs text-ink-500">{c.symbol}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-ink-600">{c.hsCode}</td>
                            <td className="px-4 py-3 text-right font-mono">
                              ${c.price.toLocaleString()}
                              <span className="text-ink-500"> / {c.unit}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`inline-flex items-center gap-0.5 font-mono text-sm ${
                                  up ? "text-savanna-700" : "text-terracotta-700"
                                }`}
                              >
                                {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                {up ? "+" : ""}
                                {c.change24h.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {c.topProducers.map((code) => {
                                  const co = getCountry(code);
                                  return (
                                    <span
                                      key={code}
                                      className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs"
                                    >
                                      {co?.flag ?? "🌍"} {co?.name ?? code}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>

        <Card className="mt-10 bg-ink-950 text-white">
          <div className="flex items-start gap-4">
            <TrendingUp className="h-6 w-6 text-terracotta-300" />
            <div>
              <h3 className="font-semibold">Why this matters</h3>
              <p className="mt-2 text-sm text-ink-200">
                African producers historically negotiated against opaque London/NY benchmarks. With
                African Commodity Exchanges (ECX in Ethiopia, GCX in Ghana, NCX in Nigeria) now
                pricing in local markets, Sokoni aggregates these alongside global benchmarks — so
                an Ivorian cocoa cooperative can price against ICCO <em>and</em> the Abidjan spot,
                and see what an Egyptian or Moroccan buyer would pay landed.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
