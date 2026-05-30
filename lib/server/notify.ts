import { eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { log } from "@/lib/log";
import { NOTIFICATION_KINDS, type NotificationKind } from "@/lib/notifications/kinds";
import { sendEmail } from "@/lib/email/resend";
import { cacheGet, cacheSet } from "@/lib/cache";

// Per-(user,kind) email cooldown in seconds. Bursty events (many shipments
// classified at once) collapse into a single email; the in-product feed still
// gets every item.
const EMAIL_COOLDOWN_SECONDS = 15 * 60;

export type { NotificationKind } from "@/lib/notifications/kinds";

export type NotifyInput = {
  workspaceId: string;
  userId?: string | null;
  kind: NotificationKind;
  title: string;
  body?: string;
  target?: string;
};

// Fire-and-forget in-product + email delivery. Honours per-user prefs in DB.
// When userId is null, notify() persists a workspace-level notification visible
// to every member.
export function notify(input: NotifyInput): void {
  const db = getDb();
  if (!db) return;

  void (async () => {
    try {
      // Default delivery from the kind catalogue.
      const defaults = NOTIFICATION_KINDS.find((k) => k.kind === input.kind);
      let deliverInProduct = defaults?.defaultInProduct ?? true;
      let deliverEmail = defaults?.defaultEmail ?? false;

      // Per-user prefs override defaults.
      if (input.userId) {
        const prefs = await db
          .select()
          .from(schema.notificationPreferences)
          .where(and(
            eq(schema.notificationPreferences.userId, input.userId),
            eq(schema.notificationPreferences.kind, input.kind)
          ))
          .limit(1);
        if (prefs[0]) {
          deliverInProduct = prefs[0].inProduct;
          deliverEmail = prefs[0].email;
        }
      }

      if (deliverInProduct) {
        await db.insert(schema.notifications).values({
          workspaceId: input.workspaceId,
          userId: input.userId ?? null,
          kind: input.kind,
          title: input.title,
          body: input.body ?? null,
          target: input.target ?? null
        });
      }

      if (deliverEmail && input.userId) {
        // Cooldown — skip the email (but keep in-product) if we emailed this
        // user about this kind within the window.
        const cooldownKey = `email-cooldown:${input.userId}:${input.kind}`;
        const recentlyEmailed = await cacheGet<number>(cooldownKey);
        if (!recentlyEmailed) {
          const rows = await db
            .select({ email: schema.users.email })
            .from(schema.users)
            .where(eq(schema.users.id, input.userId))
            .limit(1);
          const email = rows[0]?.email;
          if (email) {
            void sendEmail({
              to: email,
              subject: `[Sokoni] ${input.title}`,
              html: emailHtml(input),
              text: `${input.title}\n\n${input.body ?? ""}\n\nView: https://sokoni.africa${input.target ?? "/dashboard"}`
            });
            await cacheSet(cooldownKey, Date.now(), EMAIL_COOLDOWN_SECONDS);
          }
        }
      }
    } catch (err) {
      log.warn({ err, kind: input.kind, userId: input.userId, workspaceId: input.workspaceId }, "notify failed");
    }
  })();
}

function emailHtml(input: NotifyInput): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#fbf8f1;font-family:system-ui,sans-serif;color:#0f0f0e;">
    <table cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:20px 24px;border-bottom:1px solid #efece6;">
        <strong style="font-size:18px;">Sokoni<span style="color:#b8401f">.</span></strong>
      </td></tr>
      <tr><td style="padding:24px;">
        <h1 style="font-size:20px;margin:0 0 8px;">${escapeHtml(input.title)}</h1>
        ${input.body ? `<p style="font-size:15px;color:#3c3c39;margin:0 0 16px;">${escapeHtml(input.body)}</p>` : ""}
        ${input.target ? `<p style="margin:24px 0;"><a href="https://sokoni.africa${input.target}" style="display:inline-block;background:#b8401f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">Open in dashboard →</a></p>` : ""}
      </td></tr>
      <tr><td style="padding:16px 24px;border-top:1px solid #efece6;font-size:11px;color:#85857d;">
        You're receiving this because email notifications are on for <code>${input.kind}</code>.
        Adjust at <a href="https://sokoni.africa/dashboard/settings/notifications" style="color:#b8401f">/dashboard/settings/notifications</a>.
      </td></tr>
    </table>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}

// Bulk default-prefs creation for a newly registered user. Optional helper.
export async function seedDefaultPreferences(userId: string) {
  const db = getDb();
  if (!db) return;
  const values = NOTIFICATION_KINDS.map((k) => ({
    userId,
    kind: k.kind,
    inProduct: k.defaultInProduct,
    email: k.defaultEmail
  }));
  await db.insert(schema.notificationPreferences).values(values).onConflictDoNothing().catch(() => {});
}
