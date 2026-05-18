"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "sokoni:cookie-consent";

type Consent = "all" | "essential" | null;

export function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Consent;
      if (stored === "all" || stored === "essential") {
        setConsent(stored);
        document.cookie = `sokoni_consent=${stored}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      }
    } catch {
      // localStorage unavailable (incognito strict, SSR) — show banner.
    }
  }, []);

  function accept(value: "all" | "essential") {
    setConsent(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
      document.cookie = `sokoni_consent=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    } catch {}
  }

  if (!mounted || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-4xl rounded-2xl border border-ink-200 bg-white p-4 shadow-2xl md:inset-x-auto md:right-4 md:left-auto md:bottom-4 md:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-terracotta-50 text-terracotta-700">
          <Cookie className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Cookies & analytics</div>
          <p className="mt-1 text-sm text-ink-700">
            We use essential cookies to run the site and, with your consent, anonymous analytics
            (Vercel Analytics) to make Sokoni better. No advertising trackers, ever.
          </p>

          {expanded && (
            <div className="mt-3 space-y-2 rounded-lg bg-ink-50 p-3 text-xs">
              <Row label="Essential" status="Always on" desc="Auth session, language preference, security." />
              <Row label="Analytics" status="Opt-in" desc="Page views and feature usage. Anonymous and aggregated." />
              <Row label="Marketing" status="Disabled" desc="Not used. We don't sell or share your data." />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => accept("all")}
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
            >
              Accept all
            </button>
            <button
              onClick={() => accept("essential")}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-50"
            >
              Essential only
            </button>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs text-ink-600 hover:text-ink-900 underline-offset-2 hover:underline"
            >
              {expanded ? "Hide details" : "Customise"}
            </button>
            <Link
              href="/privacy"
              className="ml-auto text-xs text-ink-500 underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
        <button
          onClick={() => accept("essential")}
          aria-label="Dismiss"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  status,
  desc
}: {
  label: string;
  status: string;
  desc: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-semibold text-ink-900">{label}</div>
        <div className="text-ink-600">{desc}</div>
      </div>
      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-ink-700 ring-1 ring-ink-200">
        {status}
      </span>
    </div>
  );
}
