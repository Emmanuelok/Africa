"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check, Loader2 } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n/locales";

export function LocaleSwitcher({ current = "en" as Locale }: { current?: Locale }) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<Locale | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const active = LOCALES.find((l) => l.code === current) ?? LOCALES[0];
  const router = useRouter();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function pick(locale: Locale) {
    if (locale === current) {
      setOpen(false);
      return;
    }
    setSwitching(locale);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale })
      });
      // Server components read the cookie on next render — refresh.
      router.refresh();
      setOpen(false);
    } finally {
      setSwitching(null);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:border-terracotta-300 hover:text-terracotta-700"
        aria-label="Switch language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{active.flag} {active.native}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => pick(l.code)}
              disabled={switching !== null}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-sand-50 disabled:opacity-60"
            >
              <span>{l.flag} {l.native}</span>
              {switching === l.code ? (
                <Loader2 className="h-4 w-4 animate-spin text-ink-400" />
              ) : l.code === current ? (
                <Check className="h-4 w-4 text-savanna-600" />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
