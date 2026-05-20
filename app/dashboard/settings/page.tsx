import { eq } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSessionUser } from "@/lib/server/session";
import { getDb, schema } from "@/lib/db/client";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { DeleteWorkspaceDialog } from "@/components/dashboard/DeleteWorkspaceDialog";

export const metadata = { title: "Settings — Sokoni" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  const db = getDb();

  let workspaceName = user.workspaceName;
  let defaultOriginCountry = "";
  let defaultLocale = "en";

  if (db && !user.isDemo) {
    const rows = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, user.workspaceId))
      .limit(1);
    const ws = rows[0];
    if (ws) {
      workspaceName = ws.name;
      defaultOriginCountry = ws.defaultOriginCountry ?? "";
      defaultLocale = ws.defaultLocale ?? "en";
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-600">Profile, workspace, and notification preferences.</p>
      </header>

      <Card>
        <h2 className="font-semibold">Profile</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">Name</span>
            <span className="font-medium">{user.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">Email</span>
            <span className="font-mono text-xs">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">User ID</span>
            <span className="font-mono text-xs">{user.id}</span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Workspace</h2>
        <p className="mt-1 text-sm text-ink-600">
          Defaults used across the wizard, bulk uploads, and API calls.
        </p>
        <div className="mt-4">
          <SettingsForm
            initial={{ workspaceName, defaultOriginCountry, defaultLocale }}
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Notifications</h2>
            <p className="mt-1 text-sm text-ink-600">
              Per-event email and in-product delivery toggles.
            </p>
          </div>
          <a
            href="/dashboard/settings/notifications"
            className="rounded-lg border border-ink-300 px-3 py-2 text-sm font-medium hover:bg-ink-50"
          >
            Manage →
          </a>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Danger zone</h2>
        <p className="mt-1 text-sm text-ink-600">Permanent actions. Cannot be undone.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/api/workspaces/${user.workspaceId}/export`}
            className="rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium hover:bg-ink-50"
          >
            Export workspace data
          </a>
          {user.role === "owner" && !user.isDemo ? (
            <DeleteWorkspaceDialog
              workspaceId={user.workspaceId}
              workspaceName={user.workspaceName}
              trigger={
                <button className="rounded-lg border border-terracotta-300 bg-white px-4 py-2 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50">
                  Delete workspace
                </button>
              }
            />
          ) : (
            <button
              disabled
              title={user.isDemo ? "Demo mode" : "Only the workspace owner can delete"}
              className="rounded-lg border border-terracotta-300 px-4 py-2 text-sm font-medium text-terracotta-700 opacity-50"
            >
              Delete workspace
            </button>
          )}
        </div>
      </Card>

      {user.isDemo && (
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <Badge tone="warn">Demo</Badge>{" "}
          Settings persistence is disabled in demo mode.{" "}
          <a href="/register" className="font-semibold underline">Create a real account</a> to save changes.
        </div>
      )}
    </div>
  );
}
