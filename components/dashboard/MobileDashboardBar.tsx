"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  FileCheck2,
  FileSpreadsheet,
  ShieldCheck,
  Key,
  Users2,
  CreditCard,
  Settings,
  Wand2,
  Webhook,
  Activity,
  BadgeCheck,
  Palette,
  LogOut
} from "lucide-react";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import { WorkspaceSwitcher } from "@/components/dashboard/WorkspaceSwitcher";
import type { WorkspaceSummary } from "@/lib/server/workspace";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/determinations", label: "Determinations", icon: ShieldCheck },
  { href: "/dashboard/certificates", label: "Certificates", icon: FileCheck2 },
  { href: "/dashboard/bulk", label: "Bulk classify", icon: FileSpreadsheet },
  { href: "/afriorigin", label: "New shipment", icon: Wand2, primary: true },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/team", label: "Team", icon: Users2 },
  { href: "/dashboard/verification", label: "Verification", icon: BadgeCheck },
  { href: "/dashboard/branding", label: "Branding", icon: Palette },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function MobileDashboardBar({
  workspaceId,
  workspaces,
  userEmail
}: {
  workspaceId: string;
  workspaces: WorkspaceSummary[];
  userEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)));
  const active = workspaces.find((w) => w.id === workspaceId);

  return (
    <>
      <div className="sticky top-[57px] z-30 flex items-center gap-2 border-b border-ink-200 bg-white px-3 py-2 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open dashboard menu"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-700 hover:bg-ink-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <WorkspaceSwitcher workspaces={workspaces} activeId={workspaceId} />
          {current && (
            <div className="mt-0.5 px-1 text-[10px] uppercase tracking-wide text-ink-500">
              {current.label}
            </div>
          )}
        </div>
        <NotificationsBell />
      </div>

      {open && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{active?.name ?? "Workspace"}</div>
                <div className="text-xs uppercase tracking-wide text-ink-500">{active?.plan ?? ""} plan</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-ink-700 hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2">
              <ul className="space-y-0.5">
                {NAV.map((n) => {
                  const Icon = n.icon;
                  const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
                  return (
                    <li key={n.href}>
                      <Link
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          n.primary
                            ? "bg-terracotta-600 text-white hover:bg-terracotta-700"
                            : active
                              ? "bg-sand-100 font-medium text-ink-900"
                              : "text-ink-700 hover:bg-sand-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{n.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-ink-200 p-3">
              <div className="truncate px-2 text-xs text-ink-500">{userEmail}</div>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
