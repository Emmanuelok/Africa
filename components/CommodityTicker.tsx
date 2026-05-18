import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { COMMODITIES } from "@/lib/data/commodities";

export function CommodityTicker() {
  const items = [...COMMODITIES, ...COMMODITIES]; // duplicate for seamless loop
  return (
    <div className="overflow-hidden border-y border-ink-200 bg-ink-950 text-ink-100">
      <div className="ticker-track py-2.5">
        {items.map((c, i) => {
          const up = c.change24h >= 0;
          return (
            <div key={`${c.symbol}-${i}`} className="flex shrink-0 items-center gap-2 px-6 text-sm">
              <span className="font-mono text-xs text-ink-400">{c.symbol}</span>
              <span className="font-medium">{c.name}</span>
              <span className="font-mono">
                ${c.price.toLocaleString()}<span className="text-ink-400">/{c.unit}</span>
              </span>
              <span
                className={`inline-flex items-center gap-0.5 font-mono text-xs ${
                  up ? "text-savanna-300" : "text-terracotta-300"
                }`}
              >
                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {up ? "+" : ""}{c.change24h.toFixed(2)}%
              </span>
              <span className="text-ink-700">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
