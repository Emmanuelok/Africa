import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

const DEMO_ROWS = [
  ["a1", "certificate.issued", "Amara Okonkwo", "AFCFTA-K9P4XJ02", "2026-05-17T14:25:00Z"],
  ["a2", "determination.created", "Amara Okonkwo", "det_demo_001", "2026-05-17T14:22:00Z"],
  ["a3", "user.signed_in", "Amara Okonkwo", "", "2026-05-17T09:14:00Z"],
  ["a4", "webhook.endpoint.created", "Kwame Mensah", "wh_demo_001", "2026-04-22T11:02:00Z"],
  ["a5", "api_key.created", "Kwame Mensah", "key_demo_001", "2026-04-22T11:02:00Z"]
];

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Array<Array<unknown>>): string {
  return rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
}

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();
  const header = ["id", "action", "actor", "target", "ip_address", "user_agent", "metadata", "created_at"];

  let body: Array<Array<unknown>>;
  if (!db || user.isDemo) {
    body = DEMO_ROWS.map((r) => [r[0], r[1], r[2], r[3], "", "", "{}", r[4]]);
  } else {
    const rows = await db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.workspaceId, user.workspaceId))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(10000);
    body = rows.map((r) => [
      r.id,
      r.action,
      r.actor ?? "",
      r.target ?? "",
      r.ipAddress ?? "",
      r.userAgent ?? "",
      JSON.stringify(r.metadata ?? {}),
      r.createdAt.toISOString()
    ]);
  }

  const csv = toCsv([header, ...body]) + "\n";
  const filename = `sokoni-activity-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store"
    }
  });
}
