import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { DEMO_DETERMINATIONS } from "@/lib/data/demo-store";

export const runtime = "nodejs";

function esc(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Array<Array<unknown>>): string {
  return rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";
}

const HEADER = [
  "id",
  "created_at",
  "description",
  "hs_code",
  "confidence",
  "origin",
  "destination",
  "quantity",
  "fob_value_usd",
  "qualifies",
  "rule_applied",
  "mfn_rate",
  "afcfta_rate",
  "savings_usd"
];

// GET /api/determinations/export — full workspace determination history as
// CSV. Used by accounting / customs filing. Scoped to the caller's workspace.
export async function GET() {
  const user = await getSessionUser();
  const db = getDb();

  let body: Array<Array<unknown>>;
  if (!db || user.isDemo) {
    body = DEMO_DETERMINATIONS.map((d) => [
      d.id, d.createdAt, d.description, d.hsCode, d.confidence, d.originCountry, d.destinationCountry,
      d.quantity, d.fobValueUsd, d.qualifies, d.ruleApplied, d.mfnRate, d.afcftaRate, d.savingsUsd
    ]);
  } else {
    const rows = await db
      .select()
      .from(schema.determinations)
      .where(eq(schema.determinations.workspaceId, user.workspaceId))
      .orderBy(desc(schema.determinations.createdAt))
      .limit(50000);
    body = rows.map((r) => [
      r.id,
      r.createdAt.toISOString(),
      r.description,
      r.hsCode ?? "",
      r.confidence ?? "",
      r.originCountry,
      r.destinationCountry,
      r.quantity ?? "",
      r.fobValueUsd ?? "",
      r.qualifies ?? "",
      r.ruleApplied ?? "",
      r.mfnRate ?? "",
      r.afcftaRate ?? "",
      r.savingsUsd ?? ""
    ]);
  }

  const csv = toCsv([HEADER, ...body]);
  const filename = `sokoni-determinations-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store"
    }
  });
}
