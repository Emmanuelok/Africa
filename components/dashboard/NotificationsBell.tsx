"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  CreditCard,
  BadgeCheck
} from "lucide-react";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  target: string | null;
  readAt: string | null;
  createdAt: string;
};

const ICON: Record<string, React.ElementType> = {
  "certificate.issued": FileCheck2,
  "certificate.endorsed": FileCheck2,
  "determination.qualified": ShieldCheck,
  "determination.marginal": ShieldAlert,
  "determination.rejected": ShieldAlert,
  "determination.created": ShieldCheck,
  "kyb.verified": BadgeCheck,
  "kyb.rejected": ShieldAlert,
  "billing.upgraded": CreditCard,
  "billing.payment_failed": CreditCard,
  "system.update": Sparkles,
  "workspace.member_joined": Sparkles
};

export function NotificationsBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {}
  }

  useEffect(() => {
    void load();
    const interval = setInterval(load, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setUnread(0);
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true })
    });
  }

  async function markOne(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, readAt: new Date().toISOString() } : i)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] })
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications ${unread > 0 ? `(${unread} unread)` : ""}`}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-ink-700 hover:bg-ink-100"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-terracotta-600 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-ink-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
            <div className="font-semibold">Notifications</div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs text-terracotta-700 hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[420px] divide-y divide-ink-100 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-ink-500">
                You&apos;re all caught up.
              </li>
            )}
            {items.map((n) => {
              const Icon = ICON[n.kind] ?? Bell;
              const unread = !n.readAt;
              const rowClass = `flex items-start gap-3 px-4 py-3 text-sm transition-colors ${unread ? "bg-terracotta-50/40 hover:bg-terracotta-50" : "hover:bg-sand-50"}`;
              const content = (
                <>
                  <div
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      unread ? "bg-terracotta-100 text-terracotta-700" : "bg-ink-100 text-ink-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate ${unread ? "font-semibold text-ink-900" : "text-ink-800"}`}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div className="mt-0.5 line-clamp-2 text-xs text-ink-600">{n.body}</div>
                    )}
                    <div className="mt-1 text-[10px] uppercase tracking-wide text-ink-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {unread && (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta-600" />
                  )}
                </>
              );
              const onClick = () => {
                if (unread) void markOne(n.id);
                if (n.target) setOpen(false);
              };
              return (
                <li key={n.id}>
                  {n.target ? (
                    <Link href={n.target} onClick={onClick} className={rowClass}>
                      {content}
                    </Link>
                  ) : (
                    <div onClick={onClick} className={`${rowClass} cursor-default`}>
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
