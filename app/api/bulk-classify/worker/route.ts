import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { parseCsv, processRows } from "@/lib/data/bulk";
import { verifyQstashSignature } from "@/lib/queue/qstash";
import { notify } from "@/lib/server/notify";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const maxDuration = 900; // 15 min — large bulk batches need it

export async function POST(req: Request) {
  const raw = await req.text();
  const verified = await verifyQstashSignature(req, raw);
  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: { jobId?: string };
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Malformed body" }, { status: 400 }); }
  const jobId = body.jobId;
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const rows = await db.select().from(schema.bulkJobs).where(eq(schema.bulkJobs.id, jobId)).limit(1);
  const job = rows[0];
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.status === "completed" || job.status === "failed") {
    return NextResponse.json({ ok: true, alreadyDone: true });
  }

  // Claim the job.
  await db
    .update(schema.bulkJobs)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(schema.bulkJobs.id, jobId));

  log.info({ jobId, workspaceId: job.workspaceId, totalRows: job.totalRows }, "bulk job started");

  try {
    const parsed = parseCsv(job.csvInput);
    if (parsed.error) {
      await db
        .update(schema.bulkJobs)
        .set({ status: "failed", error: parsed.error, completedAt: new Date() })
        .where(eq(schema.bulkJobs.id, jobId));
      return NextResponse.json({ ok: false, error: parsed.error });
    }

    const result = await processRows(parsed.rows.slice(0, job.totalRows), {
      workspaceId: job.workspaceId,
      onProgress: async (processed) => {
        await db
          .update(schema.bulkJobs)
          .set({ processedRows: processed })
          .where(eq(schema.bulkJobs.id, jobId))
          .catch(() => {});
      }
    });

    await db
      .update(schema.bulkJobs)
      .set({
        status: result.totals.errors === parsed.rows.length ? "failed" : "completed",
        processedRows: result.results.length,
        qualifying: result.totals.qualifying,
        marginal: result.totals.marginal,
        errors: result.totals.errors,
        totalSavingsUsd: result.totals.totalSavings.toString(),
        csvOutput: result.exportCsv,
        completedAt: new Date()
      })
      .where(eq(schema.bulkJobs.id, jobId));

    if (job.userId) {
      notify({
        workspaceId: job.workspaceId,
        userId: job.userId,
        kind: "system.update",
        title: "Bulk classification finished",
        body: `${result.results.length} rows processed · ${result.totals.qualifying} qualifying · $${Math.round(result.totals.totalSavings)} saved.`,
        target: "/dashboard/bulk"
      });
    }

    log.info(
      { jobId, processed: result.results.length, qualifying: result.totals.qualifying, savings: result.totals.totalSavings },
      "bulk job completed"
    );
    return NextResponse.json({ ok: true, processed: result.results.length });
  } catch (err) {
    log.error({ err, jobId }, "bulk job failed");
    await db
      .update(schema.bulkJobs)
      .set({ status: "failed", error: err instanceof Error ? err.message.slice(0, 500) : "unknown", completedAt: new Date() })
      .where(eq(schema.bulkJobs.id, jobId));
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
