import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSessionUser } from "@/lib/server/session";
import { LOCALES } from "@/lib/i18n/locales";

export const metadata = { title: "Settings — Sokoni" };

export default async function SettingsPage() {
  const user = await getSessionUser();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-600">Profile, workspace, and notification preferences.</p>
      </header>

      <Card>
        <h2 className="font-semibold">Profile</h2>
        <form className="mt-4 space-y-3">
          <Field label="Name" defaultValue={user.name ?? ""} />
          <Field label="Email" defaultValue={user.email} type="email" />
          <button
            type="button"
            className="rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
            disabled
            title={user.isDemo ? "Demo mode" : "Coming soon"}
          >
            Save changes
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold">Workspace</h2>
        <form className="mt-4 space-y-3">
          <Field label="Workspace name" defaultValue={user.workspaceName} />
          <Field label="Default origin country" defaultValue="Kenya" />
          <div>
            <label className="text-xs uppercase tracking-wide text-ink-500">Default language</label>
            <select className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm">
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold">Notifications</h2>
        <ul className="mt-3 space-y-3 text-sm">
          <Toggle label="Determination completed" defaultChecked />
          <Toggle label="Certificate issued" defaultChecked />
          <Toggle label="Plan limit warnings" defaultChecked />
          <Toggle label="Product updates" />
          <Toggle label="AfCFTA tariff-schedule changes" defaultChecked />
        </ul>
      </Card>

      <Card>
        <h2 className="font-semibold">Danger zone</h2>
        <p className="mt-1 text-sm text-ink-600">
          Permanent actions. Cannot be undone.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled
            className="rounded-lg border border-terracotta-300 px-4 py-2 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50 disabled:opacity-50"
          >
            Export workspace data
          </button>
          <button
            disabled
            className="rounded-lg border border-terracotta-300 px-4 py-2 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50 disabled:opacity-50"
          >
            Delete workspace
          </button>
        </div>
      </Card>

      {user.isDemo && (
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <Badge tone="warn">Demo</Badge>{" "}
          Settings persistence is disabled in demo mode.{" "}
          <a href="/signup" className="font-semibold underline">Reserve a real workspace</a> to save changes.
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  defaultValue,
  type = "text"
}: {
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-ink-500">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
      />
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-5 w-9 rounded-full bg-ink-200 transition-colors peer-checked:bg-terracotta-600" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </label>
    </li>
  );
}
