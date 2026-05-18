"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n/locales";

export function LocaleSwitcher({ current = "en" as Locale }: { current?: Locale }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = LOCALES.find((l) => l.code === current) ?? LOCALES[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:border-terracotta-300 hover:text-terracotta-700"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{active.flag} {active.native}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg">
          {LOCALES.map((l) => {
            const href = l.code === "en" ? "/" : `/${l.code}`;
            return (
              <a
                key={l.code}
                href={href}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-sand-50"
              >
                <span>{l.flag} {l.native}</span>
                {l.code === current && <Check className="h-4 w-4 text-savanna-600" />}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
