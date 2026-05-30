import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { generateSecret } from "@/lib/webhooks/dispatch";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { getIdempotent, rememberIdempotent, readIdempotencyKey } from "@/lib/server/idempotency";
import { checkQuota } from "@/lib/server/quota";
import { logFor } from "@/lib/log";

export const runtime = "nodejs";

const Body = z.object({
  url: z.string().url().refine((u) => u.startsWith("https://"), { message: "URL must use https://" }),
  description: z.string().max(200).optional().nullable(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).default([])
});

export async function POST(req: Request) {
  const logger = logFor(req, { route: "/api/webhooks" });
  try {
    const user = await getSessionUser();

    const idem = readIdempotencyKey(req);
    if (idem) {
      const prev = await getIdempotent(`wh:${user.workspaceId}`, idem);
      if (prev) return NextResponse.json(prev.body, { status: prev.status });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const url = parsed.data.url.trim();
    const description = parsed.data.description?.trim().slice(0, 200) || null;
    const events = parsed.data.events;

    const q = await checkQuota(user.workspaceId, user.plan, "webhookEndpointsMax");
    if (!q.ok) {
      return NextResponse.json({ error: q.reason, used: q.used, limit: q.limit, code: "quota_exceeded" }, { status: 402 });
    }

    const secret = generateSecret();
    const db = getDb();

    if (db && !user.isDemo) {
      const inserted = await db
        .insert(schema.webhookEndpoints)
        .values({
          workspaceId: user.workspaceId,
          url,
          description,
          secret,
          events
        })
        .returning({ id: schema.webhookEndpoints.id });

      const { ipAddress, userAgent } = ipAndUaFromRequest(req);
      audit({
        workspaceId: user.workspaceId,
        userId: user.id,
        action: "webhook.endpoint.created",
        target: inserted[0].id,
        metadata: { url, events },
        ipAddress,
        userAgent
      });
      logger.info({ workspaceId: user.workspaceId, endpointId: inserted[0].id, url, events }, "webhook endpoint created");
    }

    const response = { ok: true, secret, url, events, isDemo: user.isDemo };
    if (idem) await rememberIdempotent(`wh:${user.workspaceId}`, idem, { status: 200, body: response });
    return NextResponse.json(response);
  } catch (err) {
    logger.error({ err }, "webhook endpoint create failed");
    return NextResponse.json({ error: "Could not create webhook" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) {
    return NextResponse.json({
      endpoints: [
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
      ]
    });
  }

  const rows = await db
    .select()
    .from(schema.webhookEndpoints)
    .where(eq(schema.webhookEndpoints.workspaceId, user.workspaceId))
    .orderBy(desc(schema.webhookEndpoints.createdAt));

  return NextResponse.json({
    endpoints: rows.map((r) => ({
      id: r.id,
      url: r.url,
      description: r.description,
      events: r.events as string[],
      enabled: r.enabled,
      lastDeliveryAt: r.lastDeliveryAt?.toISOString() ?? null,
      consecutiveFailures: r.consecutiveFailures,
      createdAt: r.createdAt.toISOString()
    }))
  });
}
