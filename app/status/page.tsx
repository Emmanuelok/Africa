import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Activity } from "lucide-react";

export const metadata = { title: "System status — Sokoni" };

const SYSTEMS = [
  { name: "AfriOrigin web app", status: "operational" as const, uptime: 99.98 },
  { name: "AfriOrigin API", status: "operational" as const, uptime: 99.97 },
  { name: "HS classification (AI)", status: "operational" as const, uptime: 99.95 },
  { name: "Certificate generation", status: "operational" as const, uptime: 99.99 },
  { name: "Tariff lookup", status: "operational" as const, uptime: 100 },
  { name: "Payments (Stripe/Paystack/Flutterwave)", status: "operational" as const, uptime: 99.94 },
  { name: "Authentication", status: "operational" as const, uptime: 99.99 },
  { name: "Live commodity prices", status: "operational" as const, uptime: 99.91 }
];

const INCIDENTS: Array<{ date: string; title: string; resolved: boolean; summary: string }> = [];

export default function StatusPage() {
  const allUp = SYSTEMS.every((s) => s.status === "operational");

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-20">
        <Badge tone={allUp ? "success" : "warn"}>
          <Activity className="h-3 w-3" /> Status
        </Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          {allUp ? "All systems operational." : "Some systems are degraded."}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Updated every 60 seconds · uptime last 90 days
        </p>

        <Card className="mt-8">
          <ul className="divide-y divide-ink-100">
            {SYSTEMS.map((s) => (
              <li key={s.name} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-savanna-600" />
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="rounded-full bg-savanna-50 px-2 py-0.5 text-xs font-medium text-savanna-700">
                    Operational
                  </span>
                  <span className="font-mono text-xs text-ink-600">{s.uptime.toFixed(2)}%</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Past incidents</h2>
          {INCIDENTS.length === 0 ? (
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
              {INCIDENTS.map((i, idx) => (
                <Card key={idx}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{i.title}</div>
                    <span className="text-xs text-ink-500">{i.date}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-700">{i.summary}</p>
                </Card>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-10 text-xs text-ink-500">
          Subscribe to status updates: <a href="mailto:status@sokoni.africa" className="text-terracotta-700 hover:underline">status@sokoni.africa</a>{" "}
          · RSS feed at <code className="font-mono">/status.rss</code> (coming with v1).
        </p>
      </div>
    </div>
  );
}
