import { NextResponse } from "next/server";
import { desc, gte } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { runHealthChecks } from "@/lib/server/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public status feed: live component health (real probes) + recent incidents.
// No auth — this is the data behind the /status page and any external status
// widgets. Cached briefly at the edge to absorb traffic spikes.
export async function GET() {
  const health = await runHealthChecks(false);

  // Map raw checks → user-facing components. "skipped" (not configured in
  // this deployment) is shown as operational so demo deploys look clean.
  const components = Object.entries(health.checks)
    .filter(([k]) => k !== "app")
    .map(([key, c]) => ({
      key,
      label: LABELS[key] ?? key,
      operational: c.status !== "fail",
      latencyMs: c.latencyMs ?? null
    }));
  components.unshift({ key: "app", label: "Web application", operational: true, latencyMs: null });

  let incidents: Array<Record<string, unknown>> = [];
  const db = getDb();
  if (db) {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000);
      const rows = await db
        .select()
        .from(schema.statusIncidents)
        .where(gte(schema.statusIncidents.startedAt, ninetyDaysAgo))
        .orderBy(desc(schema.statusIncidents.startedAt))
        .limit(50);
      incidents = rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        impact: r.impact,
        components: r.components,
        body: r.body,
        startedAt: r.startedAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null
      }));
    } catch {
      // table may not be migrated yet — treat as no incidents
    }
  }

  const allOperational = components.every((c) => c.operational);
  const activeIncident = incidents.find((i) => i.status !== "resolved");

  return NextResponse.json(
    {
      status: activeIncident ? "incident" : allOperational ? "operational" : "degraded",
      updatedAt: new Date().toISOString(),
      components,
      incidents
    },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } }
  );
}

const LABELS: Record<string, string> = {
  database: "Database (Postgres)",
  redis: "Cache & rate limiting (Upstash)",
  anthropic: "AI classification (Anthropic)",
  stripe: "Payments (Stripe)",
  resend: "Email delivery (Resend)",
  blob: "Document storage (Blob)",
  queue: "Background jobs (QStash)"
};
