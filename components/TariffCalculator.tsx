"use client";

import { useMemo, useState } from "react";
import { Calculator, ArrowRight, Info } from "lucide-react";
import { TARIFF_BOOK, lookupTariff } from "@/lib/data/tariffs";
import { COUNTRIES } from "@/lib/data/countries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export function TariffCalculator() {
  const [hsCode, setHsCode] = useState("0901");
  const [origin, setOrigin] = useState("KE");
  const [destination, setDestination] = useState("NG");
  const [value, setValue] = useState(50000);
  const [originating, setOriginating] = useState(true);

  const tariff = useMemo(() => lookupTariff(hsCode), [hsCode]);
  const originCountry = COUNTRIES.find((c) => c.code === origin);
  const destCountry = COUNTRIES.find((c) => c.code === destination);

  const mfnDuty = tariff ? (value * tariff.mfnRate) / 100 : 0;
  const afcftaDuty = tariff ? (value * tariff.afcftaRate) / 100 : 0;
  const applicable = originating ? afcftaDuty : mfnDuty;
  const savings = mfnDuty - afcftaDuty;
  const eligible = origin !== destination && originating;

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-terracotta-700" />
        <h3 className="font-semibold">AfCFTA Tariff Calculator</h3>
      </div>
      <p className="mt-1 text-sm text-ink-600">
        Compare MFN duty vs. AfCFTA preferential duty for any African trade lane.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="HS code (4-digit)">
          <select
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          >
            {TARIFF_BOOK.map((t) => (
              <option key={t.hsPrefix} value={t.hsPrefix}>
                {t.hsPrefix} — {t.description}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Shipment value (USD)">
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(Number(e.target.value) || 0)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          />
        </Field>

        <Field label="Origin (exporter)">
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Destination (importer)">
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="mt-4 flex items-start gap-2 rounded-lg bg-ink-50 px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={originating}
          onChange={(e) => setOriginating(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-terracotta-600"
        />
        <span className="text-ink-700">
          Goods meet AfCFTA Rules of Origin (wholly obtained, or qualifying transformation in an
          AfCFTA state).
        </span>
      </label>

      {/* Trade lane */}
      <div className="mt-5 flex items-center justify-between rounded-xl border border-ink-200 bg-sand-50 px-4 py-3 text-sm">
        <span className="flex items-center gap-2">{originCountry?.flag} <strong>{originCountry?.name}</strong></span>
        <ArrowRight className="h-4 w-4 text-ink-400" />
        <span className="flex items-center gap-2"><strong>{destCountry?.name}</strong> {destCountry?.flag}</span>
      </div>

      {/* Result */}
      {tariff ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Result label="MFN duty" value={formatCurrency(mfnDuty)} sub={`${tariff.mfnRate.toFixed(1)}%`} muted />
          <Result
            label="AfCFTA duty"
            value={formatCurrency(afcftaDuty)}
            sub={`${tariff.afcftaRate.toFixed(1)}% · Cat. ${tariff.afcftaCategory}`}
            highlight
          />
          <Result
            label={eligible ? "You save" : "Not yet eligible"}
            value={eligible ? formatCurrency(savings) : "—"}
            sub={eligible ? `${((savings / value) * 100).toFixed(1)}% of shipment value` : "Confirm RoO"}
            accent
          />
        </div>
      ) : (
        <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No tariff entry found for HS {hsCode}. In production, this queries the full AfCFTA Tariff Book.
        </div>
      )}

      <div className="mt-5 flex items-start gap-2 text-xs text-ink-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          AfCFTA tariffs phase down on schedule: Category A (90% of lines) over 5 years, Category B (7%)
          over 10 years, Category C (3% sensitive) excluded. Rates shown are indicative for May 2026.
          Estimated payable duty:{" "}
          <strong className="text-ink-900">{formatCurrency(applicable)}</strong>.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        {originCountry?.papssLive && destCountry?.papssLive ? (
          <Badge tone="success">PAPSS settlement available on this lane</Badge>
        ) : (
          <Badge tone="warn">PAPSS not yet live on this lane — bank wire fallback</Badge>
        )}
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-ink-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Result({
  label,
  value,
  sub,
  muted,
  highlight,
  accent
}: {
  label: string;
  value: string;
  sub: string;
  muted?: boolean;
  highlight?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 ${
        accent
          ? "bg-terracotta-50 text-terracotta-800"
          : highlight
          ? "bg-savanna-50 text-savanna-800"
          : "bg-ink-50 text-ink-700"
      }`}
    >
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold ${muted ? "line-through opacity-60" : ""}`}>
        {value}
      </div>
      <div className="text-xs opacity-80">{sub}</div>
    </div>
  );
}
