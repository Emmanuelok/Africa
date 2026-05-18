"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  ShieldCheck,
  Key,
  Users2,
  CreditCard,
  Settings,
  Wand2,
  LogOut
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/determinations", label: "Determinations", icon: ShieldCheck },
  { href: "/dashboard/certificates", label: "Certificates", icon: FileCheck2 },
  { href: "/afriorigin", label: "New shipment", icon: Wand2, primary: true },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/team", label: "Team", icon: Users2 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function DashboardSidebar({
  workspaceName,
  plan,
  userEmail
}: {
  workspaceName: string;
  plan: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-ink-200 bg-white md:flex md:flex-col">
      <div className="border-b border-ink-200 p-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-terracotta-600 text-sm font-semibold text-white">
            {workspaceName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{workspaceName}</div>
            <div className="text-xs uppercase tracking-wide text-ink-500">{plan} plan</div>
          </div>
        </div>
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
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
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
    </aside>
  );
}
