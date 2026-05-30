import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import Papa from "papaparse";

export const runtime = "nodejs";

// GET /api/bulk-classify/jobs/[id] — polled by the dashboard for status +
// final result. Scoped to the caller's workspace.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select()
    .from(schema.bulkJobs)
    .where(and(eq(schema.bulkJobs.id, params.id), eq(schema.bulkJobs.workspaceId, user.workspaceId)))
    .limit(1);
  const job = rows[0];
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let results: unknown[] | null = null;
  if (job.status === "completed" && job.csvOutput) {
    const parsed = Papa.parse(job.csvOutput, { header: true, skipEmptyLines: true });
    results = parsed.data.slice(0, 100); // cap response size — full export available via CSV
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    qualifying: job.qualifying,
    marginal: job.marginal,
    errors: job.errors,
    totalSavingsUsd: job.totalSavingsUsd ? Number(job.totalSavingsUsd) : 0,
    error: job.error,
    queuedAt: job.queuedAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    results,
    exportCsv: job.csvOutput
  });
}
