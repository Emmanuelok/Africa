import Link from "next/link";
import { Activity, AlertTriangle, Clock, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSessionUser } from "@/lib/server/session";
import { apiUsageSummary } from "@/lib/data/usage";

export const metadata = { title: "API usage — Sokoni" };

export default async function ApiUsagePage() {
  const user = await getSessionUser();
  const usage = await apiUsageSummary(user.workspaceId, 14);

  const maxDay = Math.max(1, ...usage.byDay.map((d) => d.calls));

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold md:text-3xl">API usage</h1>
          <Badge tone="neutral">Last {usage.windowDays} days</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-600">
          Calls, latency, and error rate across all{" "}
          <Link href="/dashboard/api-keys" className="text-terracotta-700 hover:underline">API keys</Link>{" "}
          in this workspace.
        </p>
      </header>

      {usage.totalCalls === 0 ? (
        <Card className="text-center">
          <Activity className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 text-ink-600">No API calls in the last {usage.windowDays} days.</p>
          <Link href="/docs/api" className="mt-3 inline-block text-sm font-medium text-terracotta-700 hover:underline">
            Read the API docs →
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <Metric icon={<Activity className="h-4 w-4" />} label="Total calls" value={usage.totalCalls.toLocaleString()} />
            <Metric
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Error rate"
              value={`${(usage.errorRate * 100).toFixed(2)}%`}
              sub={`${usage.errorCalls.toLocaleString()} errors`}
              accent={usage.errorRate > 0.05}
            />
            <Metric icon={<Clock className="h-4 w-4" />} label="Avg latency" value={`${usage.avgLatencyMs}ms`} />
            <Metric icon={<Zap className="h-4 w-4" />} label="p95 latency" value={`${usage.p95LatencyMs}ms`} />
          </div>

          {/* Calls per day */}
          <Card>
            <h2 className="font-display text-lg font-semibold">Calls per day</h2>
            <div className="mt-4 flex h-40 items-end gap-1">
              {usage.byDay.map((d) => {
                const h = Math.round((d.calls / maxDay) * 100);
                const errPct = d.calls ? (d.errors / d.calls) * 100 : 0;
                return (
                  <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end">
                    <div className="w-full rounded-t bg-terracotta-500/80" style={{ height: `${h}%` }}>
                      {errPct > 0 && (
                        <div className="w-full rounded-t bg-terracotta-800" style={{ height: `${errPct}%` }} />
                      )}
                    </div>
                    <div className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded bg-ink-950 px-2 py-1 text-[10px] text-white group-hover:block">
                      {d.day}: {d.calls} calls{d.errors ? `, ${d.errors} errors` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-ink-400">
              <span>{usage.byDay[0]?.day}</span>
              <span>{usage.byDay[usage.byDay.length - 1]?.day}</span>
            </div>
          </Card>

          {/* By endpoint */}
          <Card className="p-0">
            <div className="border-b border-ink-100 px-4 py-3">
              <h2 className="font-display text-lg font-semibold">By endpoint</h2>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-sand-50">
                <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3">Endpoint</th>
                  <th className="px-4 py-3 text-right">Calls</th>
                  <th className="px-4 py-3 text-right">Errors</th>
                  <th className="px-4 py-3 text-right">Avg latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {usage.byEndpoint.map((e) => (
                  <tr key={e.endpoint}>
                    <td className="px-4 py-3 font-mono text-xs">{e.endpoint}</td>
                    <td className="px-4 py-3 text-right">{e.calls.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {e.errors > 0 ? <span className="text-terracotta-700">{e.errors}</span> : "0"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{e.avgMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <p className="text-xs text-ink-500">
            Pricing is per call: $0.10 classification · $0.20 origin determination · $1.50
            certificate · $1.80 shipment pipeline · $0.02 tariff. See{" "}
            <Link href="/pricing" className="text-terracotta-700 hover:underline">pricing</Link>.
          </p>
        </>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  accent
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-terracotta-300 bg-terracotta-50/40" : ""}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-500">
        {icon} {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-600">{sub}</div>}
    </Card>
  );
}
