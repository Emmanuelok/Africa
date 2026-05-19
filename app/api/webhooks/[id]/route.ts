import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) return NextResponse.json({ ok: true, isDemo: true });

  const body = await req.json();
  const update: Partial<typeof schema.webhookEndpoints.$inferInsert> = {};
  if (typeof body?.enabled === "boolean") update.enabled = body.enabled;
  if (Array.isArray(body?.events)) update.events = body.events;
  if (typeof body?.description === "string") update.description = body.description.slice(0, 200);

  await db
    .update(schema.webhookEndpoints)
    .set(update)
    .where(and(
      eq(schema.webhookEndpoints.id, params.id),
      eq(schema.webhookEndpoints.workspaceId, user.workspaceId)
    ));

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "webhook.endpoint.updated",
    target: params.id,
    metadata: update,
    ipAddress,
    userAgent
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) return NextResponse.json({ ok: true, isDemo: true });

  await db
    .delete(schema.webhookEndpoints)
    .where(and(
      eq(schema.webhookEndpoints.id, params.id),
      eq(schema.webhookEndpoints.workspaceId, user.workspaceId)
    ));

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "webhook.endpoint.revoked",
    target: params.id,
    ipAddress,
    userAgent
  });

  return NextResponse.json({ ok: true });
}
