import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import {
  parseCsv,
  processRows,
  PLAN_BULK_LIMITS,
  ASYNC_THRESHOLD_ROWS
} from "@/lib/data/bulk";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { isQstashConfigured, enqueue } from "@/lib/queue/qstash";
import { logFor } from "@/lib/log";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ csv: z.string().min(1).max(10_000_000) });

export async function POST(req: Request) {
  const logger = logFor(req, { route: "/api/bulk-classify" });
  const ip = clientIdentifier(req);
  const rl = await rateLimit(`bulk:${ip}`, "checkout");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many bulk uploads. Try again shortly." }, { status: 429, headers });
  }

  const user = await getSessionUser();
  const planLimit = PLAN_BULK_LIMITS[user.plan] ?? PLAN_BULK_LIMITS.free;

  const json = await req.json().catch(() => ({}));
  const parsedBody = Body.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? "Invalid input" }, { status: 400, headers });
  }
  const csv = parsedBody.data.csv;

  const parsed = parseCsv(csv);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400, headers });

  const allRows = parsed.rows;
  const rows = allRows.slice(0, planLimit);
  const truncated = allRows.length > planLimit;

  const db = getDb();
  const useAsync = isQstashConfigured() && db && !user.isDemo && rows.length > ASYNC_THRESHOLD_ROWS;

  // -----------------------------------------------------------------
  // Async path — persist a job row, enqueue, return id for polling.
  // -----------------------------------------------------------------
  if (useAsync && db) {
    const inserted = await db
      .insert(schema.bulkJobs)
      .values({
        workspaceId: user.workspaceId,
        userId: user.id,
        status: "queued",
        totalRows: rows.length,
        csvInput: csv
      })
      .returning({ id: schema.bulkJobs.id });
    const jobId = inserted[0].id;

    const workerUrl = `${new URL(req.url).origin}/api/bulk-classify/worker`;
    const messageId = await enqueue({
      url: workerUrl,
      body: { jobId },
      retries: 2,
      deduplicationId: `bulk-${jobId}`
    });

    const { ipAddress, userAgent } = ipAndUaFromRequest(req);
    audit({
      workspaceId: user.workspaceId,
      userId: user.id,
      action: "bulk.classified" as never,
      target: jobId,
      metadata: { event: "queued", totalRows: rows.length, messageId },
      ipAddress,
      userAgent
    });

    logger.info({ workspaceId: user.workspaceId, jobId, totalRows: rows.length, messageId }, "bulk job queued");

    return NextResponse.json(
      { ok: true, async: true, jobId, status: "queued", totalRows: rows.length, planLimit, truncated },
      { headers }
    );
  }

  // -----------------------------------------------------------------
  // Inline path — small batches OR no queue configured.
  // -----------------------------------------------------------------
  const t0 = Date.now();
  const result = await processRows(rows, { workspaceId: user.workspaceId });

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "bulk.classified" as never,
    target: null,
    metadata: { event: "inline", totalRows: rows.length, totalSavingsUsd: result.totals.totalSavings, durationMs: Date.now() - t0 },
    ipAddress,
    userAgent
  });

  return NextResponse.json(
    {
      ok: true,
      async: false,
      processedRows: result.results.length,
      truncated,
      planLimit,
      totals: result.totals,
      results: result.results,
      exportCsv: result.exportCsv
    },
    { headers }
  );
}

// GET /api/bulk-classify — list recent jobs for this workspace.
export async function GET() {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) return NextResponse.json({ jobs: [] });

  const rows = await db
    .select({
      id: schema.bulkJobs.id,
      status: schema.bulkJobs.status,
      totalRows: schema.bulkJobs.totalRows,
      processedRows: schema.bulkJobs.processedRows,
      queuedAt: schema.bulkJobs.queuedAt,
      completedAt: schema.bulkJobs.completedAt
    })
    .from(schema.bulkJobs)
    .where(eq(schema.bulkJobs.workspaceId, user.workspaceId))
    .orderBy(desc(schema.bulkJobs.queuedAt))
    .limit(20);

  return NextResponse.json({ jobs: rows });
}
