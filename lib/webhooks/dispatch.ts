import { createHmac, randomBytes } from "crypto";
import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import type { WebhookEvent, WebhookPayload } from "./events";

const SIGNATURE_HEADER = "Sokoni-Signature";
const TIMEOUT_MS = 8000;

export function generateSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

export function sign(rawBody: string, secret: string, timestamp: number): string {
  const sig = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return `t=${timestamp},v1=${sig}`;
}

// Fan out an event to every endpoint in the workspace that's subscribed.
// Each delivery happens in parallel; failures are recorded but don't block.
export async function dispatch<T extends Record<string, unknown>>(opts: {
  workspaceId: string;
  event: WebhookEvent;
  object: T;
}) {
  const db = getDb();
  if (!db) return; // demo mode — webhooks are no-op without persistence

  const endpoints = await db
    .select()
    .from(schema.webhookEndpoints)
    .where(and(
      eq(schema.webhookEndpoints.workspaceId, opts.workspaceId),
      eq(schema.webhookEndpoints.enabled, true)
    ));

  if (endpoints.length === 0) return;

  const payload: WebhookPayload<T> = {
    id: `evt_${randomBytes(12).toString("base64url")}`,
    type: opts.event,
    created: Math.floor(Date.now() / 1000),
    data: { object: opts.object }
  };

  await Promise.all(
    endpoints
      .filter((e) => (e.events as string[]).length === 0 || (e.events as string[]).includes(opts.event))
      .map((endpoint) => deliverOnce(endpoint, payload))
  );
}

async function deliverOnce(
  endpoint: typeof schema.webhookEndpoints.$inferSelect,
  payload: WebhookPayload,
  opts: { previousAttempts?: number; replacesDeliveryId?: string } = {}
) {
  const db = getDb();
  if (!db) return;

  const rawBody = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000);
  const signature = sign(rawBody, endpoint.secret, ts);

  const start = Date.now();
  let statusCode = 0;
  let responseBody = "";
  let succeeded = false;

  try {
    const ctl = new AbortController();
    const tm = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    const res = await fetch(endpoint.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [SIGNATURE_HEADER]: signature,
        "Sokoni-Event": payload.type,
        "Sokoni-Event-Id": payload.id,
        "User-Agent": "Sokoni-Webhooks/1.0"
      },
      body: rawBody,
      signal: ctl.signal
    });
    clearTimeout(tm);
    statusCode = res.status;
    responseBody = (await res.text()).slice(0, 2000);
    succeeded = res.ok;
  } catch (err) {
    responseBody = err instanceof Error ? err.message.slice(0, 2000) : "request failed";
  }

  const durationMs = Date.now() - start;
  const attempts = (opts.previousAttempts ?? 0) + 1;

  await db.insert(schema.webhookDeliveries).values({
    endpointId: endpoint.id,
    event: payload.type,
    payload: payload as unknown as Record<string, unknown>,
    statusCode,
    responseBody,
    durationMs,
    succeeded,
    attempts,
    nextRetryAt: succeeded || attempts >= 6 ? null : retryAfter(attempts)
  }).catch((err) => console.warn("[webhooks] delivery insert failed:", err));

  // Clear the pending retry on the original row so the cron doesn't keep
  // picking it up.
  if (opts.replacesDeliveryId) {
    await db
      .update(schema.webhookDeliveries)
      .set({ nextRetryAt: null })
      .where(eq(schema.webhookDeliveries.id, opts.replacesDeliveryId))
      .catch(() => {});
  }

  await db
    .update(schema.webhookEndpoints)
    .set({
      lastDeliveryAt: new Date(),
      consecutiveFailures: succeeded ? 0 : endpoint.consecutiveFailures + 1
    })
    .where(eq(schema.webhookEndpoints.id, endpoint.id))
    .catch(() => {});

  return { succeeded, statusCode, attempts };
}

// Pulled out of dispatch() so the retry cron can drive a single delivery.
export async function redeliver(deliveryId: string) {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(schema.webhookDeliveries)
    .where(eq(schema.webhookDeliveries.id, deliveryId))
    .limit(1);
  const dlv = rows[0];
  if (!dlv) return null;

  const epRows = await db
    .select()
    .from(schema.webhookEndpoints)
    .where(eq(schema.webhookEndpoints.id, dlv.endpointId))
    .limit(1);
  const endpoint = epRows[0];
  if (!endpoint || !endpoint.enabled) return null;

  const payload = dlv.payload as unknown as WebhookPayload;
  return deliverOnce(endpoint, payload, { previousAttempts: dlv.attempts, replacesDeliveryId: dlv.id });
}

// Exponential backoff: 1m, 5m, 30m, 2h, 6h, 24h.
function retryAfter(attempt: number): Date {
  const minutes = [1, 5, 30, 120, 360, 1440][Math.min(attempt - 1, 5)];
  return new Date(Date.now() + minutes * 60_000);
}
