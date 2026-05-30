import { NextResponse } from "next/server";
import { and, eq, lte, isNotNull, desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { redeliver } from "@/lib/webhooks/dispatch";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Runs every 5 minutes (vercel.json). Picks the most recent failed delivery
// per endpoint whose nextRetryAt is in the past and tries again. Limits the
// batch to 200 deliveries per run to stay inside the function budget.
export async function GET(req: Request) {
  if (!authorize(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const summary: Record<string, number | string> = { ranAt: new Date().toISOString() };
  if (!db) {
    summary.skipped = "no database configured";
    return NextResponse.json(summary);
  }

  try {
    const due = await db
      .select()
      .from(schema.webhookDeliveries)
      .where(and(
        eq(schema.webhookDeliveries.succeeded, false),
        isNotNull(schema.webhookDeliveries.nextRetryAt),
        lte(schema.webhookDeliveries.nextRetryAt, new Date())
      ))
      .orderBy(desc(schema.webhookDeliveries.createdAt))
      .limit(200);

    // De-duplicate by endpoint — only retry the latest failed delivery per
    // endpoint to avoid hammering an endpoint that's down with stale events.
    const seen = new Set<string>();
    const toRetry: typeof due = [];
    for (const d of due) {
      if (seen.has(d.endpointId)) continue;
      seen.add(d.endpointId);
      toRetry.push(d);
    }

    let retried = 0;
    let succeeded = 0;
    for (const d of toRetry) {
      const res = await redeliver(d.id);
      if (res) {
        retried += 1;
        if (res.succeeded) succeeded += 1;
      }
    }
    summary.retried = retried;
    summary.succeeded = succeeded;
    summary.failed = retried - succeeded;
  } catch (err) {
    console.error("[cron:webhooks]", err);
    summary.error = String((err as Error).message ?? err);
    return NextResponse.json(summary, { status: 500 });
  }

  return NextResponse.json(summary);
}
