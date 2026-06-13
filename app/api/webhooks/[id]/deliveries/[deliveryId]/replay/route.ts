import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { redeliver } from "@/lib/webhooks/dispatch";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { logFor } from "@/lib/log";

export const runtime = "nodejs";

// POST /api/webhooks/[id]/deliveries/[deliveryId]/replay — manually re-send a
// past delivery's payload to its endpoint. Useful after fixing a downstream
// outage. Workspace-scoped; re-uses the same HMAC-signed delivery path as the
// retry cron.
export async function POST(req: Request, { params }: { params: { id: string; deliveryId: string } }) {
  const logger = logFor(req, { route: "/api/webhooks/[id]/deliveries/[deliveryId]/replay" });
  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json({ ok: true, isDemo: true, message: "Replay requires a real account." });
  }
  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "Only an owner or admin can replay deliveries." }, { status: 403 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  // Verify both the endpoint and the delivery belong to the caller's workspace.
  const endpointRows = await db
    .select({ id: schema.webhookEndpoints.id })
    .from(schema.webhookEndpoints)
    .where(and(
      eq(schema.webhookEndpoints.id, params.id),
      eq(schema.webhookEndpoints.workspaceId, user.workspaceId)
    ))
    .limit(1);
  if (endpointRows.length === 0) return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });

  const dlvRows = await db
    .select({ id: schema.webhookDeliveries.id, endpointId: schema.webhookDeliveries.endpointId })
    .from(schema.webhookDeliveries)
    .where(eq(schema.webhookDeliveries.id, params.deliveryId))
    .limit(1);
  const dlv = dlvRows[0];
  if (!dlv || dlv.endpointId !== params.id) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  const result = await redeliver(params.deliveryId);
  if (!result) {
    return NextResponse.json({ error: "Could not replay — endpoint may be disabled." }, { status: 409 });
  }

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "webhook.endpoint.updated",
    target: params.id,
    metadata: { event: "delivery_replayed", deliveryId: params.deliveryId, succeeded: result.succeeded, statusCode: result.statusCode },
    ipAddress,
    userAgent
  });

  logger.info({ workspaceId: user.workspaceId, endpointId: params.id, deliveryId: params.deliveryId, succeeded: result.succeeded }, "webhook delivery replayed");

  return NextResponse.json({ ok: true, succeeded: result.succeeded, statusCode: result.statusCode });
}
