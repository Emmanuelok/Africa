import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, XCircle, Activity, AlertTriangle } from "lucide-react";
import { runHealthChecks } from "@/lib/server/health";
import { getDb, schema } from "@/lib/db/client";
import { desc, gte } from "drizzle-orm";

export const metadata = { title: "System status — Sokoni" };
export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  app: "Web application",
  database: "Database (Postgres)",
  redis: "Cache & rate limiting",
  anthropic: "AI classification",
  stripe: "Payments",
  resend: "Email delivery",
  blob: "Document storage",
  queue: "Background jobs"
};

const IMPACT_TONE = { critical: "terracotta", major: "terracotta", minor: "warn", none: "neutral" } as const;

export default async function StatusPage() {
  // Real-time component health + DB-backed incidents.
  const health = await runHealthChecks(false);
  const components = Object.entries(health.checks).map(([key, c]) => ({
    key,
    label: LABELS[key] ?? key,
    operational: c.status !== "fail",
    configured: c.status !== "skipped",
    latencyMs: c.latencyMs ?? null
  }));

  let incidents: Array<{
    id: string;
    title: string;
    status: string;
    impact: string;
    body: string | null;
    startedAt: string;
    resolvedAt: string | null;
  }> = [];
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
        body: r.body,
        startedAt: r.startedAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null
      }));
    } catch {
      // not migrated yet
    }
  }

  const activeIncident = incidents.find((i) => i.status !== "resolved");
  const allUp = components.every((c) => c.operational) && !activeIncident;

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
        <Badge tone={allUp ? "success" : "warn"}>
          <Activity className="h-3 w-3" /> Status
        </Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          {activeIncident
            ? "We're investigating an incident."
            : allUp
              ? "All systems operational."
              : "Some systems are degraded."}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Live component health · refreshed on every visit
        </p>

        {activeIncident && (
          <Card className="mt-6 border-amber-300 bg-amber-50/60">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{activeIncident.title}</span>
                  <Badge tone={IMPACT_TONE[activeIncident.impact as keyof typeof IMPACT_TONE] ?? "neutral"}>
                    {activeIncident.impact}
                  </Badge>
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-amber-700">{activeIncident.status}</div>
                {activeIncident.body && <p className="mt-2 text-sm text-ink-700">{activeIncident.body}</p>}
              </div>
            </div>
          </Card>
        )}

        <Card className="mt-8">
          <ul className="divide-y divide-ink-100">
            {components.map((c) => (
              <li key={c.key} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {c.operational ? (
                    <CheckCircle2 className="h-5 w-5 text-savanna-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-terracotta-600" />
                  )}
                  <span className="text-sm font-medium">{c.label}</span>
                  {!c.configured && (
                    <span className="text-[10px] uppercase tracking-wide text-ink-400">not enabled</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {c.latencyMs != null && (
                    <span className="font-mono text-xs text-ink-400">{c.latencyMs}ms</span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.operational ? "bg-savanna-50 text-savanna-700" : "bg-terracotta-50 text-terracotta-700"
                    }`}
                  >
                    {c.operational ? "Operational" : "Down"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Past incidents (90 days)</h2>
          {incidents.length === 0 ? (
            <Card className="mt-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-savanna-600" />
              <div className="mt-2 font-semibold">No incidents in the last 90 days.</div>
              <p className="mt-1 text-sm text-ink-600">
                We post post-mortems for every incident affecting more than 1% of users for more
                than 5 minutes.
              </p>
            </Card>
          ) : (
            <ul className="mt-4 space-y-3">
              {incidents.map((i) => (
                <Card key={i.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{i.title}</span>
                      <Badge tone={i.status === "resolved" ? "savanna" : "warn"}>{i.status}</Badge>
                    </div>
                    <span className="text-xs text-ink-500">
                      {new Date(i.startedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      {i.resolvedAt && ` · resolved`}
                    </span>
                  </div>
                  {i.body && <p className="mt-2 text-sm text-ink-700">{i.body}</p>}
                </Card>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-10 text-xs text-ink-500">
          Programmatic status: <a href="/api/status" className="text-terracotta-700 hover:underline">/api/status</a>{" "}
          · health probe: <a href="/api/health" className="text-terracotta-700 hover:underline">/api/health</a>.
        </p>
      </div>
    </div>
  );
}
