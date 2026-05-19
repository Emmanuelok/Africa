import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSessionUser } from "@/lib/server/session";
import { getDb, schema } from "@/lib/db/client";
import { desc, eq } from "drizzle-orm";
import { WebhooksManager } from "@/components/dashboard/WebhooksManager";

type EndpointShape = {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  enabled: boolean;
  lastDeliveryAt: string | null;
  consecutiveFailures: number;
  createdAt: string;
};

const DEMO_ENDPOINTS: EndpointShape[] = [
  {
    id: "wh_demo_001",
    url: "https://api.highlandscoffee.coop/sokoni/webhooks",
    description: "Production ERP",
    events: ["certificate.issued", "determination.qualified"],
    enabled: true,
    lastDeliveryAt: "2026-05-18T08:14:00Z",
    consecutiveFailures: 0,
    createdAt: "2026-04-22T11:02:00Z"
  }
];

export const metadata = { title: "Webhooks — Sokoni" };

export default async function WebhooksPage() {
  const user = await getSessionUser();
  const db = getDb();

  let initial: EndpointShape[] = DEMO_ENDPOINTS;
  if (db && !user.isDemo) {
    const rows = await db
      .select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.workspaceId, user.workspaceId))
      .orderBy(desc(schema.webhookEndpoints.createdAt));
    initial = rows.map((r) => ({
      id: r.id,
      url: r.url,
      description: r.description,
      events: (r.events as string[]) ?? [],
      enabled: r.enabled,
      lastDeliveryAt: r.lastDeliveryAt?.toISOString() ?? null,
      consecutiveFailures: r.consecutiveFailures,
      createdAt: r.createdAt.toISOString()
    }));
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold md:text-3xl">Webhooks</h1>
          <Badge tone="terracotta">Forwarder tier</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-600">
          React to events in your stack — ERP sync, archive automation, support routing. Every
          payload is HMAC-signed; verify before acting.
        </p>
      </header>

      <WebhooksManager initial={initial} isDemo={user.isDemo} />

      <Card>
        <h2 className="font-semibold">Verifying signatures</h2>
        <p className="mt-1 text-sm text-ink-600">
          Every webhook carries <code>Sokoni-Signature: t=&lt;ts&gt;,v1=&lt;hex&gt;</code>. Verify
          with HMAC-SHA256 over <code>{`{t}.{raw_body}`}</code>:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-ink-950 p-4 text-xs text-ink-100">
{`import crypto from "crypto";

function verify(rawBody, header, secret) {
  const [t, v1] = header.split(",").map(p => p.split("=")[1]);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(\`\${t}.\${rawBody}\`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}`}
        </pre>
        <Link href="/docs/api/webhooks" className="mt-3 inline-block text-sm font-medium text-terracotta-700 hover:underline">
          Full webhooks reference →
        </Link>
      </Card>
    </div>
  );
}
