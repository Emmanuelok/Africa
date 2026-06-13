import { NextResponse } from "next/server";
import { lt, and, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const maxDuration = 60;

// Hit daily by Vercel Cron (see vercel.json). Vercel sets the
// `Authorization: Bearer $CRON_SECRET` header automatically when the env var
// is configured; reject anything else so this endpoint isn't world-callable.
function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // require it explicitly in prod
  const got = req.headers.get("authorization");
  return got === `Bearer ${secret}`;
}

const DAY = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const summary: Record<string, number | string> = { ranAt: new Date().toISOString() };

  if (!db) {
    summary.skipped = "no database configured";
    return NextResponse.json(summary);
  }

  const now = new Date();

  try {
    // 1. Expired sessions
    const purgedSessions = await db
      .delete(schema.sessions)
      .where(lt(schema.sessions.expires, now))
      .returning({ id: schema.sessions.sessionToken });
    summary.purgedSessions = purgedSessions.length;

    // 2. Expired verification tokens
    const purgedTokens = await db
      .delete(schema.verificationTokens)
      .where(lt(schema.verificationTokens.expires, now))
      .returning({ token: schema.verificationTokens.token });
    summary.purgedVerificationTokens = purgedTokens.length;

    // 3. Audit-log retention: keep 7 years (customs minimum), prune older.
    const sevenYearsAgo = new Date(now.getTime() - 7 * 365 * DAY);
    const purgedAudit = await db
      .delete(schema.auditLog)
      .where(lt(schema.auditLog.createdAt, sevenYearsAgo))
      .returning({ id: schema.auditLog.id });
    summary.purgedAuditEntries = purgedAudit.length;

    // 4. Notifications: 180-day retention. The audit log is the durable
    //    record; the bell feed only needs recent history.
    const sixMonthsAgo = new Date(now.getTime() - 180 * DAY);
    const purgedNotifs = await db
      .delete(schema.notifications)
      .where(lt(schema.notifications.createdAt, sixMonthsAgo))
      .returning({ id: schema.notifications.id });
    summary.purgedNotifications = purgedNotifs.length;

    // 5. Webhook delivery logs: 90-day retention. Delivery status older than
    //    that has no operational value and the table grows fast.
    const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY);
    const purgedDeliveries = await db
      .delete(schema.webhookDeliveries)
      .where(lt(schema.webhookDeliveries.createdAt, ninetyDaysAgo))
      .returning({ id: schema.webhookDeliveries.id });
    summary.purgedWebhookDeliveries = purgedDeliveries.length;

    // 6. API usage metering rows: 400-day retention (covers a full year of
    //    billing reconciliation + buffer).
    const usageCutoff = new Date(now.getTime() - 400 * DAY);
    const purgedUsage = await db
      .delete(schema.apiUsage)
      .where(lt(schema.apiUsage.createdAt, usageCutoff))
      .returning({ id: schema.apiUsage.id });
    summary.purgedApiUsage = purgedUsage.length;

    // 7. Finished bulk jobs older than 30 days — the enriched CSV has been
    //    downloaded by then; drop the heavy csvInput/csvOutput payloads.
    const bulkCutoff = new Date(now.getTime() - 30 * DAY);
    const purgedBulk = await db
      .delete(schema.bulkJobs)
      .where(lt(schema.bulkJobs.queuedAt, bulkCutoff))
      .returning({ id: schema.bulkJobs.id });
    summary.purgedBulkJobs = purgedBulk.length;

    // 8. Stale, never-accepted workspace invitations past expiry.
    const purgedInvites = await db
      .delete(schema.workspaceInvitations)
      .where(and(isNull(schema.workspaceInvitations.acceptedAt), lt(schema.workspaceInvitations.expiresAt, now)))
      .returning({ id: schema.workspaceInvitations.id });
    summary.purgedExpiredInvites = purgedInvites.length;
  } catch (err) {
    log.error({ err }, "cron cleanup failed");
    summary.error = String((err as Error).message ?? err);
    return NextResponse.json(summary, { status: 500 });
  }

  log.info(summary, "cron cleanup completed");
  return NextResponse.json(summary);
}
