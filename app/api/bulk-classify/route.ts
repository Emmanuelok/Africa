import { NextResponse } from "next/server";
import Papa from "papaparse";
import { classifyWithAI } from "@/lib/ai/classify";
import { determineOrigin } from "@/lib/data/classifier";
import { getSessionUser } from "@/lib/server/session";
import { saveDetermination } from "@/lib/data/determinations";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60; // allow longer for batch processing

const MAX_ROWS_BY_PLAN: Record<string, number> = {
  free: 5,
  pro: 50,
  bulk: 500,
  forwarder: 2000
};

type InputRow = {
  description?: string;
  origin?: string;
  destination?: string;
  quantity?: string;
  fob_value_usd?: string;
};

type OutputRow = InputRow & {
  hs_code: string;
  confidence: number;
  qualifies: "yes" | "no" | "marginal";
  rule_applied: string;
  preferential_rate: number;
  mfn_rate: number;
  savings_usd: number;
  error?: string;
};

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(`bulk:${ip}`, "checkout");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many bulk uploads. Try again shortly." }, { status: 429, headers });
  }

  try {
    const user = await getSessionUser();
    const planLimit = MAX_ROWS_BY_PLAN[user.plan] ?? MAX_ROWS_BY_PLAN.free;

    const body = await req.json();
    const csv = String(body?.csv ?? "");
    if (!csv.trim()) {
      return NextResponse.json({ error: "csv is required" }, { status: 400, headers });
    }

    const parsed = Papa.parse<InputRow>(csv, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: `CSV parse error: ${parsed.errors[0].message}` },
        { status: 400, headers }
      );
    }

    const rows = parsed.data.slice(0, planLimit);
    const truncated = parsed.data.length > planLimit;

    const results: OutputRow[] = [];
    for (const row of rows) {
      const description = String(row.description ?? "").trim();
      if (!description) {
        results.push({ ...row, hs_code: "", confidence: 0, qualifies: "no", rule_applied: "", preferential_rate: 0, mfn_rate: 0, savings_usd: 0, error: "missing description" });
        continue;
      }

      try {
        const cls = await classifyWithAI(description);
        const orig = determineOrigin({
          hsChapter: cls.hsPrefix,
          wholeObtained: true, // optimistic default — user reviews in dashboard
          regionalValueContent: 50
        });

        const fob = Number(row.fob_value_usd ?? 0);
        const mfn = cls.tariff?.mfnRate ?? 0;
        const afcfta = cls.tariff?.afcftaRate ?? 0;
        const savings = ((mfn - afcfta) * fob) / 100;

        // Persist (fire and forget — don't block the whole batch on one save)
        void saveDetermination({
          workspaceId: user.workspaceId,
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

    return NextResponse.json(
      {
        ok: true,
        processedRows: results.length,
        truncated,
        planLimit,
        totals,
        results,
        exportCsv
      },
      { headers }
    );
  } catch (err) {
    console.error("[/api/bulk-classify]", err);
    return NextResponse.json({ error: "Bulk classification failed" }, { status: 500, headers });
  }
}
