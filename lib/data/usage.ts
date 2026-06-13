import { and, eq, gte, sql, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

export type UsageSummary = {
  totalCalls: number;
  errorCalls: number;
  errorRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  byEndpoint: Array<{ endpoint: string; calls: number; errors: number; avgMs: number }>;
  byDay: Array<{ day: string; calls: number; errors: number }>;
  windowDays: number;
};

const DEMO_SUMMARY: UsageSummary = {
  totalCalls: 4820,
  errorCalls: 37,
  errorRate: 0.0077,
  avgLatencyMs: 412,
  p95LatencyMs: 1180,
  byEndpoint: [
    { endpoint: "POST /v1/classify", calls: 3120, errors: 18, avgMs: 380 },
    { endpoint: "POST /v1/determine-origin", calls: 980, errors: 6, avgMs: 95 },
    { endpoint: "POST /v1/shipments", calls: 410, errors: 9, avgMs: 1340 },
    { endpoint: "GET /v1/tariff", calls: 240, errors: 2, avgMs: 28 },
    { endpoint: "POST /v1/certificates", calls: 70, errors: 2, avgMs: 920 }
  ],
  byDay: Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    return {
      day: d.toISOString().slice(0, 10),
      calls: 250 + Math.round(Math.sin(i / 2) * 120 + i * 12),
      errors: Math.round(Math.random() * 4)
    };
  }),
  windowDays: 14
};

// Aggregate api_usage for all keys belonging to a workspace over the last N
// days. Single set of grouped queries — no per-row fetch.
export async function apiUsageSummary(workspaceId: string, windowDays = 14): Promise<UsageSummary> {
  const db = getDb();
  if (!db || workspaceId === "demo-workspace") return DEMO_SUMMARY;

  // Resolve the workspace's API key ids first (usage is keyed by api_key_id).
  const keys = await db
    .select({ id: schema.apiKeys.id })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.workspaceId, workspaceId));
  const keyIds = keys.map((k) => k.id);
  if (keyIds.length === 0) {
    return { totalCalls: 0, errorCalls: 0, errorRate: 0, avgLatencyMs: 0, p95LatencyMs: 0, byEndpoint: [], byDay: [], windowDays };
  }

  const since = new Date(Date.now() - windowDays * 86400000);
  const where = and(inArray(schema.apiUsage.apiKeyId, keyIds), gte(schema.apiUsage.createdAt, since));

  const [totals, byEndpoint, byDay] = await Promise.all([
    db
      .select({
        calls: sql<number>`count(*)::int`,
        errors: sql<number>`count(*) filter (where ${schema.apiUsage.statusCode} >= 400)::int`,
        avgMs: sql<number>`coalesce(avg(${schema.apiUsage.durationMs}), 0)::float8`,
        p95: sql<number>`coalesce(percentile_cont(0.95) within group (order by ${schema.apiUsage.durationMs}), 0)::float8`
      })
      .from(schema.apiUsage)
      .where(where),
    db
      .select({
        endpoint: schema.apiUsage.endpoint,
        calls: sql<number>`count(*)::int`,
        errors: sql<number>`count(*) filter (where ${schema.apiUsage.statusCode} >= 400)::int`,
        avgMs: sql<number>`coalesce(avg(${schema.apiUsage.durationMs}), 0)::float8`
      })
      .from(schema.apiUsage)
      .where(where)
      .groupBy(schema.apiUsage.endpoint)
      .orderBy(sql`count(*) desc`),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${schema.apiUsage.createdAt}), 'YYYY-MM-DD')`,
        calls: sql<number>`count(*)::int`,
        errors: sql<number>`count(*) filter (where ${schema.apiUsage.statusCode} >= 400)::int`
      })
      .from(schema.apiUsage)
      .where(where)
      .groupBy(sql`date_trunc('day', ${schema.apiUsage.createdAt})`)
      .orderBy(sql`date_trunc('day', ${schema.apiUsage.createdAt})`)
  ]);

  const t = totals[0];
  const totalCalls = t?.calls ?? 0;
  const errorCalls = t?.errors ?? 0;

  return {
    totalCalls,
    errorCalls,
    errorRate: totalCalls ? errorCalls / totalCalls : 0,
    avgLatencyMs: Math.round(t?.avgMs ?? 0),
    p95LatencyMs: Math.round(t?.p95 ?? 0),
    byEndpoint: byEndpoint.map((e) => ({ endpoint: e.endpoint, calls: e.calls, errors: e.errors, avgMs: Math.round(e.avgMs) })),
    byDay: byDay.map((d) => ({ day: d.day, calls: d.calls, errors: d.errors })),
    windowDays
  };
}
