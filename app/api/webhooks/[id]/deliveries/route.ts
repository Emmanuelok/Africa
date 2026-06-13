import { NextResponse } from "next/server";
import { and, desc, eq, lt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

const PAGE_SIZE = 25;

// GET /api/webhooks/[id]/deliveries?cursor=<ISO> — cursor-paginated delivery
// log for an endpoint, newest first. The cursor is the createdAt of the last
// row from the previous page.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const db = getDb();

  if (!db || user.isDemo) {
    return NextResponse.json({
      deliveries: [
        { id: "dlv_demo_001", event: "certificate.issued", statusCode: 200, succeeded: true, durationMs: 184, attempts: 1, responseBody: "{\"received\":true}", createdAt: "2026-05-18T08:14:00Z" },
        { id: "dlv_demo_002", event: "determination.qualified", statusCode: 200, succeeded: true, durationMs: 142, attempts: 1, responseBody: "ok", createdAt: "2026-05-17T14:22:00Z" },
        { id: "dlv_demo_003", event: "certificate.issued", statusCode: 503, succeeded: false, durationMs: 8003, attempts: 3, responseBody: "upstream timeout", createdAt: "2026-05-15T09:18:00Z" },
        { id: "dlv_demo_004", event: "determination.created", statusCode: 200, succeeded: true, durationMs: 96, attempts: 1, responseBody: "", createdAt: "2026-05-12T11:48:00Z" }
      ],
      nextCursor: null
    });
  }

  const owned = await db
    .select({ id: schema.webhookEndpoints.id })
    .from(schema.webhookEndpoints)
    .where(and(
      eq(schema.webhookEndpoints.id, params.id),
      eq(schema.webhookEndpoints.workspaceId, user.workspaceId)
    ))
    .limit(1);
  if (owned.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cursorParam = new URL(req.url).searchParams.get("cursor");
  const cursor = cursorParam ? new Date(cursorParam) : null;

  const where = cursor
    ? and(eq(schema.webhookDeliveries.endpointId, params.id), lt(schema.webhookDeliveries.createdAt, cursor))
    : eq(schema.webhookDeliveries.endpointId, params.id);

  const rows = await db
    .select()
    .from(schema.webhookDeliveries)
    .where(where)
    .orderBy(desc(schema.webhookDeliveries.createdAt))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  return NextResponse.json({
    deliveries: page.map((r) => ({
      id: r.id,
      event: r.event,
      statusCode: r.statusCode,
      succeeded: r.succeeded,
      durationMs: r.durationMs,
      attempts: r.attempts,
      responseBody: r.responseBody?.slice(0, 500) ?? null,
      createdAt: r.createdAt.toISOString()
    })),
    nextCursor: hasMore ? page[page.length - 1].createdAt.toISOString() : null
  });
}
