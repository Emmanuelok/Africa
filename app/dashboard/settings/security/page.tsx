import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getSessionUser } from "@/lib/server/session";
import { getDb, schema } from "@/lib/db/client";
import { TotpEnrollment } from "@/components/dashboard/TotpEnrollment";
import { SessionsManager } from "@/components/dashboard/SessionsManager";
import { DeleteAccountDialog } from "@/components/dashboard/DeleteAccountDialog";

export const metadata = { title: "Security — Sokoni" };

export default async function SecuritySettingsPage() {
  const user = await getSessionUser();
  const db = getDb();

  let totpEnabled = false;
  if (db && !user.isDemo) {
    const rows = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
    totpEnabled = !!rows[0]?.totpEnabled;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Security</h1>
        <p className="mt-1 text-sm text-ink-600">
          Two-factor authentication, active sessions, and account deletion.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Two-factor authentication
        </h2>
        <TotpEnrollment initialEnabled={totpEnabled} />
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Active sessions
        </h2>
        <SessionsManager />
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Delete account
        </h2>
        <Card>
          <p className="text-sm text-ink-700">
            Permanently remove your user account and any workspace where you are the sole owner with
            no other members. Shared workspaces must be transferred or deleted first. This is your
            GDPR right to erasure.
          </p>
          <div className="mt-4">
            {user.isDemo ? (
              <button disabled className="rounded-lg border border-terracotta-300 px-4 py-2 text-sm font-medium text-terracotta-700 opacity-50">
                Delete account
              </button>
            ) : (
              <DeleteAccountDialog
                totpEnabled={totpEnabled}
                trigger={
                  <button className="rounded-lg border border-terracotta-300 bg-white px-4 py-2 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50">
                    Delete account
                  </button>
                }
              />
            )}
          </div>
        </Card>
      </section>

      {user.isDemo && (
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <Badge tone="warn">Demo</Badge>{" "}
          Security actions are disabled in demo mode. <a href="/register" className="font-semibold underline">Create an account</a> to enable 2FA.
        </div>
      )}
    </div>
  );
}
