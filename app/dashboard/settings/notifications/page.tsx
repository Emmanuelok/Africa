import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/Badge";
import { getSessionUser } from "@/lib/server/session";
import { getDb, schema } from "@/lib/db/client";
import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";
import { NotificationPreferences } from "@/components/dashboard/NotificationPreferences";

export const metadata = { title: "Notification preferences — Sokoni" };

export default async function NotificationsSettingsPage() {
  const user = await getSessionUser();
  const db = getDb();

  const prefs: Record<string, { inProduct: boolean; email: boolean }> = {};
  for (const k of NOTIFICATION_KINDS) {
    prefs[k.kind] = { inProduct: k.defaultInProduct, email: k.defaultEmail };
  }

  if (db && !user.isDemo) {
    const rows = await db
      .select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, user.id));
    for (const r of rows) {
      prefs[r.kind] = { inProduct: r.inProduct, email: r.email };
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Notification preferences</h1>
        <p className="mt-1 text-sm text-ink-600">
          Choose what wakes you up. In-product appears in the bell at the top right; email goes
          straight to your inbox.
        </p>
      </header>

      <NotificationPreferences initial={prefs} />

      {user.isDemo && (
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <Badge tone="warn">Demo</Badge>{" "}
          Preference persistence is disabled in demo mode.{" "}
          <a href="/register" className="font-semibold underline">Create an account</a> to save changes.
        </div>
      )}
    </div>
  );
}
