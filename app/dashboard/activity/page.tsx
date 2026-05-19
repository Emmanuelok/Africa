import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldCheck,
  FileCheck2,
  Webhook,
  Key,
  Users2,
  CreditCard,
  LogIn,
  UserPlus,
  FileSpreadsheet
} from "lucide-react";
import { getSessionUser } from "@/lib/server/session";
import { getDb, schema } from "@/lib/db/client";
import { desc, eq } from "drizzle-orm";

export const metadata = { title: "Activity — Sokoni" };

type Entry = {
  id: string;
  action: string;
  actor: string | null;
  target: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const DEMO_ACTIVITY: Entry[] = [
  { id: "a1", action: "certificate.issued", actor: "Amara Okonkwo", target: "AFCFTA-K9P4XJ02", metadata: { hsCode: "0901.11" }, createdAt: "2026-05-17T14:25:00Z" },
  { id: "a2", action: "determination.created", actor: "Amara Okonkwo", target: "det_demo_001", metadata: { qualifies: "yes", savingsUsd: 930 }, createdAt: "2026-05-17T14:22:00Z" },
  { id: "a3", action: "user.signed_in", actor: "Amara Okonkwo", target: null, metadata: {}, createdAt: "2026-05-17T09:14:00Z" },
  { id: "a4", action: "webhook.endpoint.created", actor: "Kwame Mensah", target: "wh_demo_001", metadata: { url: "https://api.highlandscoffee.coop/sokoni/webhooks" }, createdAt: "2026-04-22T11:02:00Z" },
  { id: "a5", action: "api_key.created", actor: "Kwame Mensah", target: "key_demo_001", metadata: { name: "production-erp", env: "live" }, createdAt: "2026-04-22T11:02:00Z" },
  { id: "a6", action: "billing.subscribed", actor: "system", target: "sub_xxx", metadata: { plan: "pro" }, createdAt: "2026-04-22T11:00:00Z" },
  { id: "a7", action: "user.registered", actor: "Amara Okonkwo", target: null, metadata: { email: "demo@sokoni.africa" }, createdAt: "2026-04-22T10:58:00Z" },
  { id: "a8", action: "bulk.classified", actor: "Amara Okonkwo", target: null, metadata: { rows: 47, totalSavingsUsd: 8200 }, createdAt: "2026-05-12T16:30:00Z" }
];

export default async function ActivityPage() {
  const user = await getSessionUser();
  const db = getDb();

  let entries: Entry[] = DEMO_ACTIVITY;
  if (db && !user.isDemo) {
    const rows = await db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.workspaceId, user.workspaceId))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(200);
    entries = rows.map((r) => ({
      id: r.id,
      action: r.action,
      actor: r.actor ?? "system",
      target: r.target,
      metadata: (r.metadata as Record<string, unknown>) ?? null,
      createdAt: r.createdAt.toISOString()
    }));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Activity</h1>
        <p className="mt-1 text-sm text-ink-600">
          Audit trail for compliance and forensics. Every API call, webhook event, member action,
          and billing change appears here.
        </p>
      </header>

      <Card className="p-0">
        <ul className="divide-y divide-ink-100">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-4 py-3 text-sm">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sand-100 text-ink-700">
                {iconFor(e.action)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <code className="font-mono text-xs font-medium text-ink-900">{e.action}</code>
                  <Badge tone={toneFor(e.action)}>{tagFor(e.action)}</Badge>
                </div>
                <div className="mt-1 text-xs text-ink-600">
                  <strong className="text-ink-800">{e.actor ?? "system"}</strong>
                  {e.target && (
                    <>
                      {" "}· <code className="font-mono">{e.target}</code>
                    </>
                  )}
                  {e.metadata && Object.keys(e.metadata).length > 0 && (
                    <>
                      {" "}·{" "}
                      <span className="text-ink-500">
                        {Object.entries(e.metadata).slice(0, 3).map(([k, v], i) => (
                          <span key={k}>
                            {i > 0 && ", "}
                            {k}=<code className="font-mono">{String(v)}</code>
                          </span>
                        ))}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <time className="shrink-0 text-xs text-ink-500">
                {new Date(e.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="px-4 py-8 text-center text-ink-500">No activity yet.</li>
          )}
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Compliance &amp; retention</h2>
        <p className="mt-1 text-sm text-ink-600">
          Activity entries are retained for 7 years, the minimum customs record-keeping period.
          Export to CSV via the Settings page (coming soon) or via{" "}
          <a href="/docs/api" className="text-terracotta-700 hover:underline">the API</a>.
        </p>
      </Card>
    </div>
  );
}

function iconFor(action: string) {
  if (action.startsWith("determination.")) return <ShieldCheck className="h-4 w-4" />;
  if (action.startsWith("certificate.")) return <FileCheck2 className="h-4 w-4" />;
  if (action.startsWith("webhook.")) return <Webhook className="h-4 w-4" />;
  if (action.startsWith("api_key.")) return <Key className="h-4 w-4" />;
  if (action.startsWith("workspace.")) return <Users2 className="h-4 w-4" />;
  if (action.startsWith("billing.")) return <CreditCard className="h-4 w-4" />;
  if (action === "user.signed_in") return <LogIn className="h-4 w-4" />;
  if (action === "user.registered") return <UserPlus className="h-4 w-4" />;
  if (action.startsWith("bulk.")) return <FileSpreadsheet className="h-4 w-4" />;
  return <ShieldCheck className="h-4 w-4" />;
}

function toneFor(action: string): "savanna" | "neutral" | "warn" | "terracotta" | "info" {
  if (action.endsWith(".revoked") || action.endsWith(".rejected") || action.endsWith(".canceled")) return "terracotta";
  if (action.endsWith(".marginal")) return "warn";
  if (action.startsWith("certificate.")) return "savanna";
  if (action.startsWith("billing.")) return "info";
  return "neutral";
}

function tagFor(action: string): string {
  return action.split(".")[0];
}
