"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  FileText,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  Wand2
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { COUNTRIES } from "@/lib/data/countries";
import {
  classifyProduct,
  determineOrigin,
  type Classification,
  type OriginResult
} from "@/lib/data/classifier";
import { formatCurrency } from "@/lib/utils";

type WizardState = {
  description: string;
  origin: string;
  destination: string;
  quantity: number;
  fobValue: number;
  classification: Classification | null;
  // Step 2 inputs
  wholeObtained: boolean;
  changeOfTariffHeading: boolean;
  regionalValueContent: number;
  substantialTransformation: boolean;
  inputsImportedFromOutsideAfrica: boolean;
  originResult: OriginResult | null;
  // Exporter details for CoO
  exporterName: string;
  exporterAddress: string;
  consigneeName: string;
  consigneeAddress: string;
};

const INITIAL: WizardState = {
  description: "",
  origin: "KE",
  destination: "NG",
  quantity: 1500,
  fobValue: 50000,
  classification: null,
  wholeObtained: true,
  changeOfTariffHeading: true,
  regionalValueContent: 45,
  substantialTransformation: true,
  inputsImportedFromOutsideAfrica: false,
  originResult: null,
  exporterName: "",
  exporterAddress: "",
  consigneeName: "",
  consigneeAddress: ""
};

export function AfriOriginWizard() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL);

  function update<K extends keyof WizardState>(k: K, v: WizardState[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function runClassify() {
    if (!state.description.trim()) return;
    const result = classifyProduct(state.description);
    update("classification", result);
  }

  function runOriginCheck() {
    if (!state.classification) return;
    const chapter = parseInt(state.classification.hsPrefix.slice(0, 2), 10);
    const wo = chapter <= 15 || (chapter >= 25 && chapter <= 27);
    const result = determineOrigin({
      hsChapter: state.classification.hsPrefix,
      wholeObtained: wo ? state.wholeObtained : undefined,
      changeOfTariffHeading: state.changeOfTariffHeading,
      regionalValueContent: state.regionalValueContent,
      substantialTransformation: state.substantialTransformation,
      inputsImportedFromOutsideAfrica: state.inputsImportedFromOutsideAfrica
    } as any);
    update("originResult", result);
  }

  const savings = useMemo(() => {
    if (!state.classification?.tariff) return null;
    const t = state.classification.tariff;
    const mfn = (state.fobValue * t.mfnRate) / 100;
    const afcfta = (state.fobValue * t.afcftaRate) / 100;
    return { mfn, afcfta, saved: mfn - afcfta, mfnRate: t.mfnRate, afcftaRate: t.afcftaRate };
  }, [state.classification, state.fobValue]);

  return (
    <div>
      {/* Step progress */}
      <Stepper step={step} />

      <div className="mt-8">
        {step === 1 && (
          <StepOne
            state={state}
            update={update}
            onClassify={runClassify}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && state.classification && (
          <StepTwo
            state={state}
            update={update}
            onCheck={runOriginCheck}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && state.classification && state.originResult && savings && (
          <StepThree
            state={state}
            update={update}
            savings={savings}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const steps = [
    { n: 1, label: "Describe product", icon: Sparkles },
    { n: 2, label: "Origin determination", icon: ShieldCheck },
    { n: 3, label: "Savings & certificate", icon: FileText }
  ];
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((s) => {
        const active = s.n === step;
        const done = s.n < step;
        const Icon = s.icon;
        return (
          <li
            key={s.n}
            className={`rounded-xl border px-4 py-3 transition-all ${
              active
                ? "border-terracotta-500 bg-terracotta-50"
                : done
                ? "border-savanna-300 bg-savanna-50"
                : "border-ink-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-terracotta-600 text-white"
                    : done
                    ? "bg-savanna-600 text-white"
                    : "bg-ink-200 text-ink-600"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
              </span>
              Step {s.n}
            </div>
            <div className="mt-2 flex items-center gap-2 font-semibold">
              <Icon className="h-4 w-4 text-ink-700" />
              {s.label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepOne({
  state,
  update,
  onClassify,
  onNext
}: {
  state: WizardState;
  update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  onClassify: () => void;
  onNext: () => void;
}) {
  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">Describe what you&apos;re shipping</h2>
      <p className="mt-1 text-sm text-ink-600">
        We&apos;ll classify your product against the HS 2022 nomenclature and pull the matching AfCFTA
        tariff line.
      </p>

      <div className="mt-6 grid gap-4">
        <Field label="Product description">
          <textarea
            rows={3}
            value={state.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="e.g. Premium washed Arabica green coffee beans, AA grade, 60kg jute bags"
            className="w-full rounded-lg border border-ink-200 bg-white p-3 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Country of origin (you)">
            <CountrySelect value={state.origin} onChange={(v) => update("origin", v)} />
          </Field>
          <Field label="Destination country">
            <CountrySelect value={state.destination} onChange={(v) => update("destination", v)} />
          </Field>
          <Field label="Quantity">
            <input
              type="number"
              value={state.quantity}
              onChange={(e) => update("quantity", Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </Field>
          <Field label="Estimated FOB value (USD)">
            <input
              type="number"
              value={state.fobValue}
              onChange={(e) => update("fobValue", Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </Field>
        </div>

        <Button onClick={onClassify} disabled={!state.description.trim()}>
          <Wand2 className="h-4 w-4" /> Classify with AI
        </Button>
      </div>

      {state.classification && (
        <div className="mt-6 rounded-xl border border-savanna-300 bg-savanna-50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-savanna-700" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="savanna">HS {state.classification.hsPrefix}</Badge>
                <Badge tone="info">
                  {(state.classification.confidence * 100).toFixed(0)}% confidence
                </Badge>
                {state.classification.tariff && (
                  <Badge tone="terracotta">
                    AfCFTA Cat. {state.classification.tariff.afcftaCategory}
                  </Badge>
                )}
              </div>
              <div className="mt-2 font-semibold text-savanna-900">
                {state.classification.description}
              </div>
              {state.classification.tariff && (
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-ink-500">MFN rate:</span>{" "}
                    <strong>{state.classification.tariff.mfnRate.toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span className="text-ink-500">AfCFTA rate (May 2026):</span>{" "}
                    <strong className="text-savanna-700">
                      {state.classification.tariff.afcftaRate.toFixed(1)}%
                    </strong>
                  </div>
                </div>
              )}
              {state.classification.alternates.length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-ink-600 hover:text-ink-900">
                    Other possible HS codes ({state.classification.alternates.length})
                  </summary>
                  <ul className="mt-2 space-y-1 text-ink-700">
                    {state.classification.alternates.map((a) => (
                      <li key={a.hsPrefix} className="font-mono text-xs">
                        {a.hsPrefix} — {a.description} ({(a.confidence * 100).toFixed(0)}%)
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={onNext}>
              Continue to origin check <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function StepTwo({
  state,
  update,
  onCheck,
  onBack,
  onNext
}: {
  state: WizardState;
  update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  onCheck: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const chapter = parseInt(state.classification!.hsPrefix.slice(0, 2), 10);
  const isAgMineral = chapter <= 15 || (chapter >= 25 && chapter <= 27);
  const isTextile = chapter >= 50 && chapter <= 63;

  return (
    <Card>
      <h2 className="font-display text-xl font-semibold">Does your shipment qualify under AfCFTA Rules of Origin?</h2>
      <p className="mt-1 text-sm text-ink-600">
        The preferential rate only applies if your goods meet the chapter-specific origin rule. We&apos;ll
        ask just what we need to know.
      </p>

      <div className="mt-5 rounded-lg bg-sand-50 p-4 text-sm">
        <div className="font-semibold">Classification recap</div>
        <div className="mt-1 text-ink-700">
          HS <span className="font-mono">{state.classification!.hsPrefix}</span> · {state.classification!.description}
        </div>
        <div className="mt-1 text-xs text-ink-500">
          Chapter {chapter} rule:{" "}
          {isAgMineral
            ? "Wholly Obtained"
            : isTextile
            ? "Yarn-forward (double transformation)"
            : "Change of Tariff Heading OR ≥40% Regional Value Content"}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {isAgMineral ? (
          <Toggle
            checked={state.wholeObtained}
            onChange={(v) => update("wholeObtained", v)}
            label={`Were all raw materials (seeds, animals, ore) sourced from within ${countryName(state.origin)} or another AfCFTA state?`}
          />
        ) : (
          <>
            <Toggle
              checked={state.changeOfTariffHeading}
              onChange={(v) => update("changeOfTariffHeading", v)}
              label="Does your product fall under a different HS heading than its imported inputs? (Change of tariff heading)"
            />
            <Toggle
              checked={state.substantialTransformation}
              onChange={(v) => update("substantialTransformation", v)}
              label="Was the final product substantially transformed (not just packaging or relabelling) inside AfCFTA states?"
            />
            <Field label={`Estimated Regional Value Content (% of cost added within AfCFTA states): ${state.regionalValueContent}%`}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={state.regionalValueContent}
                onChange={(e) => update("regionalValueContent", Number(e.target.value))}
                className="w-full accent-terracotta-600"
              />
              <div className="mt-1 flex justify-between text-xs text-ink-500">
                <span>0%</span>
                <span className="font-medium text-terracotta-700">Threshold: 40%</span>
                <span>100%</span>
              </div>
            </Field>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onCheck}>
          <ShieldCheck className="h-4 w-4" /> Check origin
        </Button>
      </div>

      {state.originResult && (
        <div
          className={`mt-6 rounded-xl border p-5 ${
            state.originResult.qualifies === "yes"
              ? "border-savanna-300 bg-savanna-50"
              : state.originResult.qualifies === "marginal"
              ? "border-amber-300 bg-amber-50"
              : "border-terracotta-300 bg-terracotta-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {state.originResult.qualifies === "yes" ? (
              <CheckCircle2 className="mt-0.5 h-6 w-6 text-savanna-700" />
            ) : state.originResult.qualifies === "marginal" ? (
              <AlertCircle className="mt-0.5 h-6 w-6 text-amber-700" />
            ) : (
              <XCircle className="mt-0.5 h-6 w-6 text-terracotta-700" />
            )}
            <div className="flex-1">
              <div className="font-display text-xl font-semibold">
                {state.originResult.qualifies === "yes"
                  ? "Qualifies for AfCFTA preferential rate"
                  : state.originResult.qualifies === "marginal"
                  ? "Marginal — review recommended"
                  : "Does not currently qualify"}
              </div>
              <div className="mt-1 text-sm text-ink-700">Rule applied: {state.originResult.rule}</div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {state.originResult.reasoning.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-500">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {state.originResult.qualifies !== "no" && (
            <div className="mt-5 flex justify-end">
              <Button onClick={onNext}>
                Continue to savings <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function StepThree({
  state,
  update,
  savings,
  onBack
}: {
  state: WizardState;
  update: <K extends keyof WizardState>(k: K, v: WizardState[K]) => void;
  savings: { mfn: number; afcfta: number; saved: number; mfnRate: number; afcftaRate: number };
  onBack: () => void;
}) {
  function generateCertificate() {
    const params = new URLSearchParams({
      hs: state.classification!.hsPrefix,
      desc: state.classification!.description,
      origin: state.origin,
      dest: state.destination,
      qty: String(state.quantity),
      value: String(state.fobValue),
      mfn: savings.mfnRate.toFixed(1),
      afcfta: savings.afcftaRate.toFixed(1),
      exporter: state.exporterName,
      exporterAddr: state.exporterAddress,
      consignee: state.consigneeName,
      consigneeAddr: state.consigneeAddress
    });
    window.open(`/afriorigin/certificate?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-savanna-50 to-sand-50">
        <Badge tone="savanna">Preferential rate confirmed</Badge>
        <h2 className="mt-3 font-display text-2xl font-semibold">
          You save {formatCurrency(savings.saved)} on this shipment.
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Result label="MFN duty (without AfCFTA)" value={formatCurrency(savings.mfn)} sub={`${savings.mfnRate.toFixed(1)}%`} muted />
          <Result label="AfCFTA duty" value={formatCurrency(savings.afcfta)} sub={`${savings.afcftaRate.toFixed(1)}%`} highlight />
          <Result
            label="Your savings"
            value={formatCurrency(savings.saved)}
            sub={`${((savings.saved / state.fobValue) * 100).toFixed(2)}% of shipment value`}
            accent
          />
        </div>
        <p className="mt-4 text-xs text-ink-600">
          Indicative payable duty:{" "}
          <strong className="text-ink-900">{formatCurrency(savings.afcfta)}</strong> ·{" "}
          Trade lane: {countryName(state.origin)} → {countryName(state.destination)}
        </p>
      </Card>

      <Card>
        <h3 className="font-semibold">Exporter & consignee details</h3>
        <p className="mt-1 text-sm text-ink-600">
          These details print onto the AfCFTA Certificate of Origin (Annex II, Appendix I format).
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Exporter / shipper name">
            <input
              type="text"
              value={state.exporterName}
              onChange={(e) => update("exporterName", e.target.value)}
              placeholder="e.g. Highlands Coffee Cooperative Ltd"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </Field>
          <Field label="Consignee name">
            <input
              type="text"
              value={state.consigneeName}
              onChange={(e) => update("consigneeName", e.target.value)}
              placeholder="e.g. Lagos Roasters Ltd"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </Field>
          <Field label="Exporter address">
            <input
              type="text"
              value={state.exporterAddress}
              onChange={(e) => update("exporterAddress", e.target.value)}
              placeholder="Street, city, country"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </Field>
          <Field label="Consignee address">
            <input
              type="text"
              value={state.consigneeAddress}
              onChange={(e) => update("consigneeAddress", e.target.value)}
              placeholder="Street, city, country"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </Field>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold">Generate your trade documents</h3>
        <p className="mt-1 text-sm text-ink-600">
          Per the 2025 AU Digital Trade Protocol, AfCFTA State Parties accept these in electronic form.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button onClick={generateCertificate} className="justify-start">
            <FileText className="h-4 w-4" /> AfCFTA Certificate of Origin
          </Button>
          <Button onClick={generateCertificate} variant="outline" className="justify-start">
            <Download className="h-4 w-4" /> Commercial invoice (preview)
          </Button>
          <Button onClick={generateCertificate} variant="outline" className="justify-start">
            <Download className="h-4 w-4" /> Packing list (preview)
          </Button>
          <Button variant="outline" className="justify-start">
            <Download className="h-4 w-4" /> Origin declaration
          </Button>
        </div>
        <p className="mt-4 text-xs text-ink-500">
          Click any document to preview a print-ready, customs-acceptable version. Use your browser&apos;s
          Print → Save as PDF to download.
        </p>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Link href="/marketplace" className="text-sm font-medium text-terracotta-700 hover:underline">
          Find buyers on the marketplace →
        </Link>
      </div>
    </div>
  );
}

// === Sub-components ===

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-ink-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
    >
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.name}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-ink-200 bg-white p-4 hover:border-terracotta-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-terracotta-600"
      />
      <span className="text-sm text-ink-800">{label}</span>
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
          ? "bg-terracotta-100 text-terracotta-900"
          : highlight
          ? "bg-savanna-100 text-savanna-900"
          : "bg-white text-ink-800"
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

function countryName(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
