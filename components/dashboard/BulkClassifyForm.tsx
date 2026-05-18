"use client";

import { useState, useRef } from "react";
import { Upload, Download, Loader2, AlertTriangle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const SAMPLE_CSV = `description,origin,destination,quantity,fob_value_usd
"AA grade Arabica green coffee beans, 60kg jute bags",KE,NG,1500,9300
"Chrome-tanned full-grain calfskin leather, 1.0-1.2mm",ET,EG,800,14400
"Raw shea butter, unrefined, food grade, 25kg drums",GH,MA,2500,6250
"Hibiscus dried flowers, ISO-certified, 50kg woven bags",SD,SN,3200,11200`;

type Result = {
  description: string;
  hs_code: string;
  qualifies: "yes" | "no" | "marginal";
  rule_applied: string;
  savings_usd: number;
  error?: string;
};

type Response = {
  ok: boolean;
  processedRows: number;
  truncated: boolean;
  planLimit: number;
  totals: { totalSavings: number; qualifying: number; marginal: number; errors: number };
  results: Result[];
  exportCsv: string;
};

export function BulkClassifyForm({ planLimit }: { planLimit: number }) {
  const [csv, setCsv] = useState("");
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFileChosen(file: File) {
    const text = await file.text();
    setCsv(text);
    setError(null);
    setResponse(null);
  }

  async function submit() {
    if (!csv.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch("/api/bulk-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Bulk classification failed");
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk classification failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    if (!response?.exportCsv) return;
    const blob = new Blob([response.exportCsv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sokoni-bulk-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {!response && (
        <Card>
          <div
            className="rounded-xl border-2 border-dashed border-ink-300 bg-sand-50 p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) void onFileChosen(file);
            }}
          >
            <FileSpreadsheet className="mx-auto h-10 w-10 text-ink-400" />
            <p className="mt-3 font-medium">Drop a CSV here</p>
            <p className="mt-1 text-sm text-ink-600">
              or{" "}
              <button
                onClick={() => fileRef.current?.click()}
                className="font-medium text-terracotta-700 hover:underline"
              >
                browse files
              </button>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFileChosen(file);
              }}
            />
            <p className="mt-3 text-xs text-ink-500">
              Up to {planLimit.toLocaleString()} rows per upload on your plan.{" "}
              <button
                onClick={() => setCsv(SAMPLE_CSV)}
                className="underline-offset-2 hover:underline"
              >
                Try a sample
              </button>
            </p>
          </div>

          {csv && (
            <div className="mt-4">
              <div className="text-xs uppercase tracking-wide text-ink-500">Preview</div>
              <textarea
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                className="mt-1 h-40 w-full rounded-lg border border-ink-200 bg-white p-3 font-mono text-xs"
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={submit}
              disabled={!csv.trim() || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Classifying…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Classify batch
                </>
              )}
            </button>
            <span className="text-xs text-ink-500">
              Columns: <code>description, origin, destination, quantity, fob_value_usd</code>
            </span>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </Card>
      )}

      {response && (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-savanna-600" />
                <div>
                  <div className="font-semibold">
                    Processed {response.processedRows.toLocaleString()} rows
                  </div>
                  <div className="text-sm text-ink-600">
                    {response.totals.qualifying} qualified · {response.totals.marginal} marginal ·{" "}
                    {response.totals.errors} errors
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wide text-ink-500">Total AfCFTA savings</div>
                <div className="font-display text-2xl font-semibold text-savanna-700">
                  ${response.totals.totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
            {response.truncated && (
              <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                Your plan caps bulk uploads at {response.planLimit.toLocaleString()} rows. The remaining
                rows weren&apos;t processed. <a href="/pricing" className="underline">Upgrade →</a>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={downloadCsv}
                className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
              >
                <Download className="h-4 w-4" /> Download enriched CSV
              </button>
              <button
                onClick={() => { setResponse(null); setCsv(""); }}
                className="rounded-lg border border-ink-300 px-4 py-2 text-sm hover:bg-ink-50"
              >
                Run another batch
              </button>
            </div>
          </Card>

          <Card className="p-0">
            <table className="min-w-full text-sm">
              <thead className="bg-sand-50">
                <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">HS</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {response.results.slice(0, 25).map((r, i) => (
                  <tr key={i}>
                    <td className="max-w-[320px] truncate px-4 py-2">{r.description}</td>
                    <td className="px-4 py-2 font-mono text-xs">{r.hs_code || "—"}</td>
                    <td className="px-4 py-2">
                      {r.error ? (
                        <Badge tone="terracotta">Error</Badge>
                      ) : r.qualifies === "yes" ? (
                        <Badge tone="savanna">Qualifies</Badge>
                      ) : r.qualifies === "marginal" ? (
                        <Badge tone="warn">Marginal</Badge>
                      ) : (
                        <Badge tone="neutral">No</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-savanna-700">
                      ${r.savings_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
                {response.results.length > 25 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-xs text-ink-500">
                      Showing first 25 — download the CSV for the full set.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
