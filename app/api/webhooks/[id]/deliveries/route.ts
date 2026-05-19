import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const db = getDb();

  if (!db || user.isDemo) {
    return NextResponse.json({
      deliveries: [
        { id: "dlv_demo_001", event: "certificate.issued", statusCode: 200, succeeded: true, durationMs: 184, attempts: 1, createdAt: "2026-05-18T08:14:00Z" },
        { id: "dlv_demo_002", event: "determination.qualified", statusCode: 200, succeeded: true, durationMs: 142, attempts: 1, createdAt: "2026-05-17T14:22:00Z" },
        { id: "dlv_demo_003", event: "certificate.issued", statusCode: 503, succeeded: false, durationMs: 8003, attempts: 3, createdAt: "2026-05-15T09:18:00Z" },
        { id: "dlv_demo_004", event: "determination.created", statusCode: 200, succeeded: true, durationMs: 96, attempts: 1, createdAt: "2026-05-12T11:48:00Z" }
      ]
    });
  }

  // Ensure ownership of the endpoint first.
  const owned = await db
    .select({ id: schema.webhookEndpoints.id })
    .from(schema.webhookEndpoints)
    .where(and(
      eq(schema.webhookEndpoints.id, params.id),
      eq(schema.webhookEndpoints.workspaceId, user.workspaceId)
    ))
    .limit(1);
  if (owned.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select()
    .from(schema.webhookDeliveries)
    .where(eq(schema.webhookDeliveries.endpointId, params.id))
    .orderBy(desc(schema.webhookDeliveries.createdAt))
    .limit(50);

  return NextResponse.json({
    deliveries: rows.map((r) => ({
      id: r.id,
      event: r.event,
      statusCode: r.statusCode,
      succeeded: r.succeeded,
      durationMs: r.durationMs,
      attempts: r.attempts,
      createdAt: r.createdAt.toISOString()
    }))
  });
}
