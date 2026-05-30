import { Card } from "@/components/ui/Card";
import { Download } from "lucide-react";
import { getSessionUser } from "@/lib/server/session";
import { getDb, schema } from "@/lib/db/client";
import { desc, eq } from "drizzle-orm";
import { ActivityFeed, type ActivityEntry } from "@/components/dashboard/ActivityFeed";

export const metadata = { title: "Activity — Sokoni" };

const DEMO_ACTIVITY: ActivityEntry[] = [
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

  let entries: ActivityEntry[] = DEMO_ACTIVITY;
  if (db && !user.isDemo) {
    const rows = await db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.workspaceId, user.workspaceId))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(500);
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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold md:text-3xl">Activity</h1>
          <p className="mt-1 text-sm text-ink-600">
            Audit trail for compliance and forensics. Every API call, webhook event, member action,
            and billing change appears here.
          </p>
        </div>
        <a
          href="/api/audit/export"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm font-medium hover:bg-ink-50"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </header>

      <ActivityFeed entries={entries} />

      <Card>
        <h2 className="font-semibold">Compliance &amp; retention</h2>
        <p className="mt-1 text-sm text-ink-600">
          Activity entries are retained for 7 years, the minimum customs record-keeping period.
          Export the full trail as CSV above, or pull it programmatically via{" "}
          <a href="/docs/api" className="text-terracotta-700 hover:underline">the API</a>.
        </p>
      </Card>
    </div>
  );
}
