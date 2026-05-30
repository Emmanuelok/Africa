import Papa from "papaparse";
import { classifyWithAI } from "@/lib/ai/classify";
import { determineOrigin } from "@/lib/data/classifier";
import { saveDetermination } from "@/lib/data/determinations";

// Shared bulk-classification pipeline. Used inline by the synchronous path
// (small batches) and by the QStash worker for async jobs.

export type InputRow = {
  description?: string;
  origin?: string;
  destination?: string;
  quantity?: string;
  fob_value_usd?: string;
};

export type OutputRow = InputRow & {
  hs_code: string;
  confidence: number;
  qualifies: "yes" | "no" | "marginal";
  rule_applied: string;
  preferential_rate: number;
  mfn_rate: number;
  savings_usd: number;
  error?: string;
};

export type ProcessResult = {
  results: OutputRow[];
  totals: { totalSavings: number; qualifying: number; marginal: number; errors: number };
  exportCsv: string;
};

export function parseCsv(csv: string): { rows: InputRow[]; error?: string } {
  const parsed = Papa.parse<InputRow>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    return { rows: [], error: `CSV parse error: ${parsed.errors[0].message}` };
  }
  return { rows: parsed.data };
}

export type ProcessOpts = {
  workspaceId: string;
  onProgress?: (processed: number, total: number) => Promise<void>;
};

export async function processRows(rows: InputRow[], opts: ProcessOpts): Promise<ProcessResult> {
  const results: OutputRow[] = [];

  for (const [i, row] of rows.entries()) {
    const description = String(row.description ?? "").trim();
    if (!description) {
      results.push({
        ...row,
        hs_code: "",
        confidence: 0,
        qualifies: "no",
        rule_applied: "",
        preferential_rate: 0,
        mfn_rate: 0,
        savings_usd: 0,
        error: "missing description"
      });
      continue;
    }

    try {
      const cls = await classifyWithAI(description);
      const orig = determineOrigin({
        hsChapter: cls.hsPrefix,
        wholeObtained: true,
        regionalValueContent: 50
      });

      const fob = Number(row.fob_value_usd ?? 0);
      const mfn = cls.tariff?.mfnRate ?? 0;
      const afcfta = cls.tariff?.afcftaRate ?? 0;
      const savings = ((mfn - afcfta) * fob) / 100;

      void saveDetermination({
        workspaceId: opts.workspaceId,
        description,
        hsCode: cls.hsPrefix,
        confidence: cls.confidence,
        originCountry: String(row.origin ?? "").toUpperCase(),
        destinationCountry: String(row.destination ?? "").toUpperCase(),
        quantity: Number(row.quantity ?? 0) || undefined,
        fobValueUsd: fob || undefined,
        qualifies: orig.qualifies,
        ruleApplied: orig.rule,
        mfnRate: mfn,
        afcftaRate: afcfta,
        savingsUsd: savings
      });

      results.push({
        ...row,
        hs_code: cls.hsPrefix,
        confidence: cls.confidence,
        qualifies: orig.qualifies,
        rule_applied: orig.rule,
        preferential_rate: afcfta,
        mfn_rate: mfn,
        savings_usd: Math.round(savings * 100) / 100
      });
    } catch (err) {
      results.push({
        ...row,
        hs_code: "",
        confidence: 0,
        qualifies: "no",
        rule_applied: "",
        preferential_rate: 0,
        mfn_rate: 0,
        savings_usd: 0,
        error: err instanceof Error ? err.message : "classification failed"
      });
    }

    // Update progress every 10 rows so the dashboard can poll meaningfully.
    if (opts.onProgress && i % 10 === 9) {
      await opts.onProgress(i + 1, rows.length).catch(() => {});
    }
  }

  if (opts.onProgress) {
    await opts.onProgress(rows.length, rows.length).catch(() => {});
  }

  const totals = results.reduce(
    (acc, r) => {
      acc.totalSavings += r.savings_usd;
      if (r.qualifies === "yes") acc.qualifying += 1;
      if (r.qualifies === "marginal") acc.marginal += 1;
      if (r.error) acc.errors += 1;
      return acc;
    },
    { totalSavings: 0, qualifying: 0, marginal: 0, errors: 0 }
  );

  const exportCsv = Papa.unparse(results);
  return { results, totals, exportCsv };
}

export const PLAN_BULK_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  bulk: 500,
  forwarder: 2000
};

// Async threshold: anything bigger than this gets queued when QStash is
// configured. Smaller batches still run inline (faster round-trip + no
// queue cost).
export const ASYNC_THRESHOLD_ROWS = 30;
