import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { generateSecret } from "@/lib/webhooks/dispatch";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

const URL_RE = /^https:\/\//; // require HTTPS

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const url = String(body?.url ?? "").trim();
    const description = String(body?.description ?? "").trim().slice(0, 200) || null;
    const events: string[] = Array.isArray(body?.events) ? body.events.filter((e: unknown) => typeof e === "string") : [];

    if (!URL_RE.test(url)) {
      return NextResponse.json({ error: "URL must use https://" }, { status: 400 });
    }
    if (events.length > 0) {
      const invalid = events.filter((e) => !WEBHOOK_EVENTS.includes(e as (typeof WEBHOOK_EVENTS)[number]));
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Unknown events: ${invalid.join(", ")}. Allowed: ${WEBHOOK_EVENTS.join(", ")}` },
          { status: 400 }
        );
      }
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
    }

    // Secret returned once. Customers store it for verifying signatures.
    return NextResponse.json({ ok: true, secret, url, events, isDemo: user.isDemo });
  } catch (err) {
    console.error("[/api/webhooks POST]", err);
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
