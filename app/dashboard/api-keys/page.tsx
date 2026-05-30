import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSessionUser } from "@/lib/server/session";
import { DEMO_API_KEYS } from "@/lib/data/demo-store";
import { ApiKeysManager } from "@/components/dashboard/ApiKeysManager";
import { getDb, schema } from "@/lib/db/client";
import { and, desc, eq, isNull } from "drizzle-orm";

export const metadata = { title: "API keys — Sokoni" };

export default async function ApiKeysPage() {
  const user = await getSessionUser();
  const db = getDb();

  let initial = DEMO_API_KEYS;
  if (db && !user.isDemo) {
    const rows = await db
      .select()
      .from(schema.apiKeys)
      .where(and(eq(schema.apiKeys.workspaceId, user.workspaceId), isNull(schema.apiKeys.revokedAt)))
      .orderBy(desc(schema.apiKeys.createdAt));
    initial = rows.map((r) => ({
      id: r.id,
      name: r.name,
      prefix: r.prefix,
      maskedKey: `${r.prefix}••••••••••••${r.hashedKey.slice(-4)}`,
      scopes: (r.scopes as string[]) ?? ["*"],
      lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString()
    }));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">API keys</h1>
        <p className="mt-1 text-sm text-ink-600">
          Authenticate the{" "}
          <Link href="/docs/api" className="text-terracotta-700 hover:underline">
            Sokoni API
          </Link>{" "}
          with these keys. Test keys never bill; live keys count against your plan.
        </p>
      </header>

      <ApiKeysManager initial={initial} isDemo={user.isDemo} />

      <Card>
        <h2 className="font-semibold">Quickstart</h2>
        <p className="mt-1 text-sm text-ink-600">
          Try your key with a single classification call:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-ink-950 p-4 text-xs text-ink-100">
{`curl -X POST https://sokoni.africa/api/v1/classify \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "description": "AA grade Arabica green coffee beans, 60kg jute" }'`}
        </pre>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge tone="neutral">Endpoints</Badge>
          <code className="rounded bg-ink-100 px-2 py-0.5 font-mono">POST /api/v1/classify</code>
          <code className="rounded bg-ink-100 px-2 py-0.5 font-mono">POST /api/v1/determine-origin</code>
          <code className="rounded bg-ink-100 px-2 py-0.5 font-mono">GET /api/v1/tariff</code>
        </div>
        <Link
          href="/docs/api"
          className="mt-4 inline-block text-sm font-medium text-terracotta-700 hover:underline"
        >
          Full API docs →
        </Link>
      </Card>
    </div>
  );
}
