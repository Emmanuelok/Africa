"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath, geoCentroid } from "d3-geo";
import { ArrowUpRight, ArrowDownRight, Radio, X, Sparkles, MapPin } from "lucide-react";
import africaGeo from "@/lib/data/africa-geo.json";
import { COMMODITIES, type Commodity } from "@/lib/data/commodities";
import { getCountry } from "@/lib/data/countries";

type Feature = {
  type: "Feature";
  id: string;
  properties: { iso2: string; name: string };
  geometry: any;
};

const FEATURES = (africaGeo as any).features as Feature[];

// Indexed map: ISO-2 → commodities produced (with rank position)
function buildProducerIndex() {
  const idx = new Map<string, Array<{ commodity: Commodity; rank: number }>>();
  for (const c of COMMODITIES) {
    c.topProducers.forEach((iso2, i) => {
      const arr = idx.get(iso2) ?? [];
      arr.push({ commodity: c, rank: i + 1 });
      idx.set(iso2, arr);
    });
  }
  return idx;
}

const PRODUCERS = buildProducerIndex();

// Build seed sparkline history so each commodity has 24 ticks to start
function makeSparkline(seed: number, points = 24, vol = 0.02) {
  const arr: number[] = [];
  let v = seed;
  for (let i = 0; i < points; i++) {
    v = v * (1 + (Math.random() - 0.5) * vol);
    arr.push(v);
  }
  return arr;
}

export function AfricaMap() {
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [tick, setTick] = useState(0);

  // Live prices: { symbol → { price, change24h, history[] } }
  const [livePrices, setLivePrices] = useState(() => {
    const map: Record<string, { price: number; change24h: number; history: number[]; flash: 1 | -1 | 0 }> = {};
    for (const c of COMMODITIES) {
      map[c.symbol] = {
        price: c.price,
        change24h: c.change24h,
        history: makeSparkline(c.price),
        flash: 0
      };
    }
    return map;
  });

  // Tick: every 3.5s, walk each price slightly and update sparkline
  useEffect(() => {
    const id = setInterval(() => {
      setLivePrices((prev) => {
        const next: typeof prev = {};
        for (const c of COMMODITIES) {
          const p = prev[c.symbol];
          const delta = (Math.random() - 0.49) * 0.008; // mostly tiny moves
          const newPrice = Math.max(0.001, p.price * (1 + delta));
          const newHist = [...p.history.slice(1), newPrice];
          const newChange = p.change24h + delta * 100 * 0.5;
          next[c.symbol] = {
            price: newPrice,
            change24h: newChange,
            history: newHist,
            flash: delta > 0 ? 1 : -1
          };
        }
        return next;
      });
      setTick((t) => t + 1);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // Clear flash after 600ms
  useEffect(() => {
    const id = setTimeout(() => {
      setLivePrices((prev) => {
        const next: typeof prev = {};
        for (const k in prev) next[k] = { ...prev[k], flash: 0 };
        return next;
      });
    }, 600);
    return () => clearTimeout(id);
  }, [tick]);

  // Geo projection — fit Africa into the viewbox
  const projection = useMemo(() => {
    const proj = geoMercator();
    proj.fitSize([800, 800], { type: "FeatureCollection", features: FEATURES } as any);
    return proj;
  }, []);

  const pathGen = useMemo(() => geoPath(projection as any), [projection]);

  function colorForCountry(iso2: string): string {
    const items = PRODUCERS.get(iso2) ?? [];
    if (selectedSymbol) {
      const inMatch = items.some((x) => x.commodity.symbol === selectedSymbol);
      if (!inMatch) return "#f1efe9"; // dim
      const rank = items.find((x) => x.commodity.symbol === selectedSymbol)?.rank ?? 4;
      // Rank 1: deep terracotta; rank 4+: lighter
      const shades = ["#92301c", "#b8401f", "#d4552a", "#e07248", "#eb9b78"];
      return shades[Math.min(rank - 1, shades.length - 1)];
    }
    // No filter: heat by count of commodities produced
    const count = items.length;
    if (count === 0) return "#f1efe9";
    if (count === 1) return "#f4c4ad";
    if (count === 2) return "#eb9b78";
    if (count === 3) return "#d4552a";
    return "#92301c";
  }

  const focusedCommodity = selectedSymbol
    ? COMMODITIES.find((c) => c.symbol === selectedSymbol)
    : null;

  // Selected country panel data
  const selectedCountryData = selectedIso
    ? {
        country: getCountry(selectedIso),
        feature: FEATURES.find((f) => f.id === selectedIso),
        commodities: PRODUCERS.get(selectedIso) ?? []
      }
    : null;

  // For commodity-focused: ranked list of producers with mock market share
  const producerRanking = focusedCommodity
    ? focusedCommodity.topProducers
        .map((iso2, i) => {
          const total = focusedCommodity.topProducers.length;
          // synthetic market share: weighted by rank
          const shareWeights = [0.42, 0.26, 0.18, 0.09, 0.05];
          const share = shareWeights[i] ?? Math.max(0.02, 0.05 - i * 0.01);
          return { iso2, rank: i + 1, share, country: getCountry(iso2) };
        })
        .filter((x) => x.country)
    : [];

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    setMouse({ x: e.clientX, y: e.clientY });
  }

  return (
    <div className="rounded-3xl border border-ink-200 bg-white p-4 shadow-sm md:p-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-terracotta-600" />
          </span>
          <div>
            <div className="text-sm font-semibold">Live African Commodity Map</div>
            <div className="text-xs text-ink-500">
              {COMMODITIES.length} commodities · {FEATURES.length} countries · prices stream every 3.5s
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <CommodityChip
            label="All"
            active={!selectedSymbol}
            onClick={() => setSelectedSymbol(null)}
          />
          {COMMODITIES.map((c) => (
            <CommodityChip
              key={c.symbol}
              label={c.name}
              active={selectedSymbol === c.symbol}
              onClick={() => setSelectedSymbol(selectedSymbol === c.symbol ? null : c.symbol)}
            />
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Map */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sand-50 via-white to-savanna-50 ring-1 ring-ink-200">
          <svg
            viewBox="0 0 800 800"
            className="block h-auto w-full"
            onMouseMove={onMouseMove}
            onMouseLeave={() => {
              setHoverIso(null);
              setMouse(null);
            }}
          >
            {/* Subtle longitude/latitude grid */}
            <defs>
              <pattern id="graticule" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e7e7e5" strokeWidth="0.5" />
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="800" height="800" fill="url(#graticule)" opacity="0.5" />

            {/* Country paths */}
            {FEATURES.map((f) => {
              const d = pathGen(f as any) ?? "";
              const isHover = hoverIso === f.id;
              const isSelected = selectedIso === f.id;
              const fill = colorForCountry(f.id);
              return (
                <path
                  key={f.id}
                  d={d}
                  fill={fill}
                  stroke={isSelected ? "#92301c" : isHover ? "#b8401f" : "#fbf8f1"}
                  strokeWidth={isSelected ? 2.5 : isHover ? 1.5 : 0.6}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoverIso(f.id)}
                  onClick={() => setSelectedIso(isSelected ? null : f.id)}
                  style={{ filter: isSelected ? "url(#glow)" : undefined }}
                />
              );
            })}

            {/* Country labels for top producers of focused commodity */}
            {focusedCommodity &&
              focusedCommodity.topProducers.map((iso2) => {
                const feat = FEATURES.find((f) => f.id === iso2);
                if (!feat) return null;
                const [cx, cy] = projection(geoCentroid(feat as any)) ?? [0, 0];
                const country = getCountry(iso2);
                if (!country) return null;
                return (
                  <g key={iso2} pointerEvents="none">
                    <circle cx={cx} cy={cy} r={4} fill="#fbf8f1" stroke="#92301c" strokeWidth="1.5" />
                    <text
                      x={cx + 7}
                      y={cy + 4}
                      className="fill-ink-900 text-[11px] font-semibold"
                      style={{ paintOrder: "stroke", stroke: "#fbf8f1", strokeWidth: 3 }}
                    >
                      {country.name}
                    </text>
                  </g>
                );
              })}

            {/* Legend */}
            <g transform="translate(20, 720)">
              <rect x="0" y="0" width="280" height="60" rx="8" fill="white" opacity="0.85" />
              <text x="12" y="18" className="fill-ink-700 text-[11px] font-semibold">
                {focusedCommodity ? `Top producers — ${focusedCommodity.name}` : "Commodities produced"}
              </text>
              {focusedCommodity ? (
                <>
                  {["#92301c", "#b8401f", "#d4552a", "#e07248", "#eb9b78"].map((c, i) => (
                    <g key={c} transform={`translate(${12 + i * 50}, 30)`}>
                      <rect width="14" height="14" fill={c} rx="2" />
                      <text x="18" y="11" className="fill-ink-700 text-[10px]">#{i + 1}</text>
                    </g>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { c: "#f1efe9", l: "0" },
                    { c: "#f4c4ad", l: "1" },
                    { c: "#eb9b78", l: "2" },
                    { c: "#d4552a", l: "3" },
                    { c: "#92301c", l: "4+" }
                  ].map((x, i) => (
                    <g key={x.l} transform={`translate(${12 + i * 50}, 30)`}>
                      <rect width="14" height="14" fill={x.c} rx="2" />
                      <text x="18" y="11" className="fill-ink-700 text-[10px]">{x.l}</text>
                    </g>
                  ))}
                </>
              )}
            </g>
          </svg>

          {/* Hover tooltip */}
          {hoverIso && mouse && (
            <Tooltip
              iso2={hoverIso}
              x={mouse.x}
              y={mouse.y}
              livePrices={livePrices}
              focusedSymbol={selectedSymbol}
            />
          )}
        </div>

        {/* Side panel */}
        <div className="flex min-h-[500px] flex-col">
          {selectedCountryData ? (
            <CountryPanel
              data={selectedCountryData}
              livePrices={livePrices}
              onClose={() => setSelectedIso(null)}
            />
          ) : focusedCommodity ? (
            <CommodityPanel
              commodity={focusedCommodity}
              ranking={producerRanking}
              live={livePrices[focusedCommodity.symbol]}
              onPickCountry={(iso2) => setSelectedIso(iso2)}
            />
          ) : (
            <MarketOverview livePrices={livePrices} onPick={(sym) => setSelectedSymbol(sym)} />
          )}
        </div>
      </div>

      {/* Live ticker strip */}
      <div className="mt-5 overflow-hidden rounded-xl border border-ink-200 bg-ink-950">
        <div className="ticker-track py-2.5">
          {[...COMMODITIES, ...COMMODITIES].map((c, i) => {
            const live = livePrices[c.symbol];
            const up = live.change24h >= 0;
            return (
              <div
                key={`${c.symbol}-${i}`}
                className="flex shrink-0 items-center gap-2 px-6 text-xs text-ink-100"
              >
                <span className="font-mono text-[10px] text-ink-400">{c.symbol}</span>
                <span className="font-medium">{c.name}</span>
                <span
                  className={`font-mono transition-colors duration-500 ${
                    live.flash === 1 ? "text-savanna-300" : live.flash === -1 ? "text-terracotta-300" : ""
                  }`}
                >
                  ${live.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span className="text-ink-400">/{c.unit}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 font-mono ${
                    up ? "text-savanna-300" : "text-terracotta-300"
                  }`}
                >
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {up ? "+" : ""}{live.change24h.toFixed(2)}%
                </span>
                <span className="text-ink-700">•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// === Sub-components ===

function CommodityChip({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
        active
          ? "border-terracotta-600 bg-terracotta-600 text-white"
          : "border-ink-200 bg-white text-ink-700 hover:border-terracotta-300 hover:text-terracotta-700"
      }`}
    >
      {label}
    </button>
  );
}

function Tooltip({
  iso2,
  x,
  y,
  livePrices,
  focusedSymbol
}: {
  iso2: string;
  x: number;
  y: number;
  livePrices: Record<string, { price: number; change24h: number; history: number[]; flash: 1 | -1 | 0 }>;
  focusedSymbol: string | null;
}) {
  const country = getCountry(iso2);
  const items = PRODUCERS.get(iso2) ?? [];
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 max-w-xs rounded-xl border border-ink-200 bg-white p-3 shadow-xl"
      style={{ left: x + 14, top: y + 14, transform: "translate(0, -100%)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{country?.flag ?? "🌍"}</span>
        <span className="font-semibold">{country?.name ?? iso2}</span>
      </div>
      {items.length === 0 ? (
        <div className="mt-2 text-xs text-ink-500">No tradable commodities mapped yet.</div>
      ) : (
        <div className="mt-2 space-y-1.5">
          {items.slice(0, 4).map(({ commodity, rank }) => {
            const live = livePrices[commodity.symbol];
            const up = live.change24h >= 0;
            const isFocus = focusedSymbol === commodity.symbol;
            return (
              <div
                key={commodity.symbol}
                className={`flex items-center justify-between gap-3 text-xs ${
                  isFocus ? "rounded-md bg-terracotta-50 px-2 py-1" : ""
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-terracotta-500" />
                  {commodity.name} <span className="text-ink-400">#{rank}</span>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  ${live.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span className={up ? "text-savanna-600" : "text-terracotta-600"}>
                    {up ? "▲" : "▼"}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-2 text-[10px] text-ink-400">Click to drill in</div>
    </div>
  );
}

function CountryPanel({
  data,
  livePrices,
  onClose
}: {
  data: {
    country: ReturnType<typeof getCountry>;
    feature: Feature | undefined;
    commodities: Array<{ commodity: Commodity; rank: number }>;
  };
  livePrices: Record<string, { price: number; change24h: number; history: number[]; flash: 1 | -1 | 0 }>;
  onClose: () => void;
}) {
  const { country, commodities } = data;
  if (!country) return null;
  return (
    <div className="flex h-full flex-col rounded-2xl bg-ink-50 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-3xl">
            <span>{country.flag}</span>
            <span className="font-display text-xl font-semibold text-ink-900">{country.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white px-2 py-0.5 text-ink-700 ring-1 ring-ink-200">
              {country.region} Africa
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-ink-700 ring-1 ring-ink-200">
              {country.currency}
            </span>
            {country.papssLive ? (
              <span className="rounded-full bg-savanna-100 px-2 py-0.5 text-savanna-800">
                PAPSS live
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
                PAPSS pending
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-ink-500 hover:bg-white hover:text-ink-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 text-xs uppercase tracking-wide text-ink-500">
        Tradable commodities ({commodities.length})
      </div>
      {commodities.length === 0 ? (
        <div className="mt-3 text-sm text-ink-600">
          No commodities mapped to this country yet. Add your supply listing to bootstrap the
          benchmark.
        </div>
      ) : (
        <ul className="mt-3 flex-1 space-y-2 overflow-y-auto">
          {commodities
            .sort((a, b) => a.rank - b.rank)
            .map(({ commodity, rank }) => {
              const live = livePrices[commodity.symbol];
              const up = live.change24h >= 0;
              return (
                <li
                  key={commodity.symbol}
                  className="rounded-xl border border-ink-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-terracotta-50 px-1.5 py-0.5 text-[10px] font-semibold text-terracotta-700">
                          #{rank}
                        </span>
                        <span className="text-sm font-semibold">{commodity.name}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-ink-500">
                        HS {commodity.hsCode} · {commodity.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-mono text-sm transition-colors duration-500 ${
                          live.flash === 1
                            ? "text-savanna-600"
                            : live.flash === -1
                            ? "text-terracotta-600"
                            : "text-ink-900"
                        }`}
                      >
                        ${live.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      <div
                        className={`inline-flex items-center gap-0.5 font-mono text-[11px] ${
                          up ? "text-savanna-600" : "text-terracotta-600"
                        }`}
                      >
                        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {up ? "+" : ""}{live.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Sparkline data={live.history} positive={up} />
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

function CommodityPanel({
  commodity,
  ranking,
  live,
  onPickCountry
}: {
  commodity: Commodity;
  ranking: Array<{ iso2: string; rank: number; share: number; country: ReturnType<typeof getCountry> }>;
  live: { price: number; change24h: number; history: number[]; flash: 1 | -1 | 0 };
  onPickCountry: (iso2: string) => void;
}) {
  const up = live.change24h >= 0;
  return (
    <div className="flex h-full flex-col rounded-2xl bg-ink-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-ink-500">{commodity.category}</div>
          <div className="mt-1 font-display text-xl font-semibold">{commodity.name}</div>
          <div className="mt-1 text-xs font-mono text-ink-500">
            {commodity.symbol} · HS {commodity.hsCode}
          </div>
        </div>
        <div className="text-right">
          <div
            className={`font-display text-2xl font-semibold transition-colors duration-500 ${
              live.flash === 1
                ? "text-savanna-600"
                : live.flash === -1
                ? "text-terracotta-600"
                : "text-ink-900"
            }`}
          >
            ${live.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-ink-500">per {commodity.unit}</div>
          <div
            className={`mt-1 inline-flex items-center gap-0.5 font-mono text-xs ${
              up ? "text-savanna-600" : "text-terracotta-600"
            }`}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {up ? "+" : ""}{live.change24h.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-ink-200">
        <Sparkline data={live.history} positive={up} tall />
      </div>

      <div className="mt-4 text-xs uppercase tracking-wide text-ink-500">
        Top African producers
      </div>
      <ol className="mt-2 space-y-2 overflow-y-auto">
        {ranking.map((r, i) => {
          const shades = ["#92301c", "#b8401f", "#d4552a", "#e07248", "#eb9b78"];
          return (
            <li key={r.iso2}>
              <button
                onClick={() => onPickCountry(r.iso2)}
                className="flex w-full items-center gap-3 rounded-xl border border-ink-200 bg-white p-3 text-left transition-colors hover:border-terracotta-300"
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-md text-xs font-bold text-white"
                  style={{ backgroundColor: shades[i] ?? "#eb9b78" }}
                >
                  #{r.rank}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span>{r.country?.flag}</span> {r.country?.name}
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-terracotta-500"
                      style={{ width: `${(r.share * 100).toFixed(0)}%` }}
                    />
                  </div>
                </div>
                <div className="font-mono text-xs text-ink-700">
                  {(r.share * 100).toFixed(1)}%
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MarketOverview({
  livePrices,
  onPick
}: {
  livePrices: Record<string, { price: number; change24h: number; history: number[]; flash: 1 | -1 | 0 }>;
  onPick: (symbol: string) => void;
}) {
  const sorted = [...COMMODITIES].sort(
    (a, b) => Math.abs(livePrices[b.symbol].change24h) - Math.abs(livePrices[a.symbol].change24h)
  );

  return (
    <div className="flex h-full flex-col rounded-2xl bg-ink-50 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-terracotta-600" />
        <span className="text-xs uppercase tracking-wide text-ink-500">Most active right now</span>
      </div>
      <div className="mt-1 font-display text-lg font-semibold">
        Select a commodity or click a country
      </div>
      <p className="mt-1 text-xs text-ink-600">
        Hover any country to see what it produces. Pick a commodity above to see its top African
        producers light up.
      </p>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
        {sorted.slice(0, 8).map((c) => {
          const live = livePrices[c.symbol];
          const up = live.change24h >= 0;
          return (
            <button
              key={c.symbol}
              onClick={() => onPick(c.symbol)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white p-3 text-left transition-colors hover:border-terracotta-300"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-terracotta-50 text-terracotta-700">
                  <MapPin className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-[11px] text-ink-500">
                    {c.topProducers.length} African producers
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-mono text-sm transition-colors duration-500 ${
                    live.flash === 1
                      ? "text-savanna-600"
                      : live.flash === -1
                      ? "text-terracotta-600"
                      : "text-ink-900"
                  }`}
                >
                  ${live.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div
                  className={`inline-flex items-center gap-0.5 font-mono text-[11px] ${
                    up ? "text-savanna-600" : "text-terracotta-600"
                  }`}
                >
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {up ? "+" : ""}{live.change24h.toFixed(2)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-500">
        <Radio className="h-3 w-3 animate-pulse text-terracotta-600" />
        Streaming · prices indicative, refresh every 3.5s
      </div>
    </div>
  );
}

function Sparkline({
  data,
  positive,
  tall
}: {
  data: number[];
  positive: boolean;
  tall?: boolean;
}) {
  const w = 200;
  const h = tall ? 60 : 24;
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");
  const color = positive ? "#76913a" : "#b8401f";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkgrad-${positive ? "up" : "dn"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#sparkgrad-${positive ? "up" : "dn"})`} />
    </svg>
  );
}
