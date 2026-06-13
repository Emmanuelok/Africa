import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { DEMO_CERTIFICATES } from "@/lib/data/demo-store";

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
  "reference",
  "created_at",
  "exporter",
  "consignee",
  "endorsed",
  "determination_id",
  "verify_url"
];

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();

  let body: Array<Array<unknown>>;
  if (!db || user.isDemo) {
    body = DEMO_CERTIFICATES.map((c) => [
      c.id, c.reference, c.createdAt, c.exporterName, c.consigneeName,
      c.endorsedByAuthority, c.determinationId, `${SITE}/verify/${c.reference}`
    ]);
  } else {
    const rows = await db
      .select()
      .from(schema.certificates)
      .where(eq(schema.certificates.workspaceId, user.workspaceId))
      .orderBy(desc(schema.certificates.createdAt))
      .limit(50000);
    body = rows.map((r) => [
      r.id,
      r.reference,
      r.createdAt.toISOString(),
      r.exporterName ?? "",
      r.consigneeName ?? "",
      r.endorsedByAuthority,
      r.determinationId ?? "",
      `${SITE}/verify/${r.reference}`
    ]);
  }

  const csv = toCsv([HEADER, ...body]);
  const filename = `sokoni-certificates-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store"
    }
  });
}
