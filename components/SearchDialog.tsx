"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  FileText,
  ShoppingBag,
  Building2,
  Globe2,
  TrendingUp,
  Layout,
  ArrowRight,
  Loader2
} from "lucide-react";

type Result = {
  id: string;
  title: string;
  description: string;
  href: string;
  kind: "doc" | "marketplace" | "supplier" | "country" | "commodity" | "page";
};

const ICONS: Record<Result["kind"], React.ElementType> = {
  doc: FileText,
  marketplace: ShoppingBag,
  supplier: Building2,
  country: Globe2,
  commodity: TrendingUp,
  page: Layout
};

const LABELS: Record<Result["kind"], string> = {
  doc: "Docs",
  marketplace: "Marketplace",
  supplier: "Supplier",
  country: "Country",
  commodity: "Commodity",
  page: "Page"
};

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open with ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else { setQ(""); setResults([]); setActive(0); }
  }, [open]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = await res.json();
        setResults(data.results ?? []);
        setActive(0);
      } catch {} finally {
        setLoading(false);
      }
    }, 120);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [q]);

  function go(r: Result) {
    setOpen(false);
    router.push(r.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-500 hover:border-ink-300 hover:bg-ink-50 sm:inline-flex"
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search…</span>
        <kbd className="ml-3 hidden rounded border border-ink-200 bg-sand-50 px-1.5 py-0.5 font-mono text-[10px] text-ink-500 md:inline-block">
          ⌘K
        </kbd>
      </button>

      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="grid h-9 w-9 place-items-center rounded-lg text-ink-700 hover:bg-ink-100 sm:hidden"
      >
        <Search className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[10vh]">
          <div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl">
            <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-3">
              <Search className="h-4 w-4 text-ink-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search docs, products, countries, commodities…"
                className="flex-1 bg-transparent text-sm placeholder:text-ink-400 focus:outline-none"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-ink-400" />}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {q.length === 0 && (
                <div className="p-6 text-sm text-ink-500">
                  Start typing to search across docs, marketplace, suppliers, countries, and
                  commodities. Press <kbd className="rounded border border-ink-200 bg-sand-50 px-1.5 py-0.5 font-mono text-[10px]">↑</kbd>{" "}
                  <kbd className="rounded border border-ink-200 bg-sand-50 px-1.5 py-0.5 font-mono text-[10px]">↓</kbd> to
                  navigate, <kbd className="rounded border border-ink-200 bg-sand-50 px-1.5 py-0.5 font-mono text-[10px]">↵</kbd> to open.
                </div>
              )}

              {q.length > 0 && results.length === 0 && !loading && (
                <div className="p-6 text-center text-sm text-ink-500">
                  Nothing for <strong>{q}</strong>. Try a different keyword.
                </div>
              )}

              {results.length > 0 && (
                <ul>
                  {results.map((r, i) => {
                    const Icon = ICONS[r.kind];
                    return (
                      <li key={r.id}>
                        <Link
                          href={r.href}
                          onClick={() => setOpen(false)}
                          onMouseEnter={() => setActive(i)}
                          className={`flex items-start gap-3 px-4 py-3 text-sm ${
                            i === active ? "bg-terracotta-50" : ""
                          }`}
                        >
                          <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-700">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-ink-900">{r.title}</span>
                              <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-600">
                                {LABELS[r.kind]}
                              </span>
                            </div>
                            <div className="mt-0.5 line-clamp-1 text-xs text-ink-600">
                              {r.description}
                            </div>
                          </div>
                          <ArrowRight className="mt-2 h-3 w-3 shrink-0 text-ink-400" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-ink-200 bg-sand-50/50 px-4 py-2 text-[11px] text-ink-500">
              <kbd className="rounded border border-ink-200 bg-white px-1.5 py-0.5 font-mono">⌘K</kbd> to open ·
              {" "}<kbd className="rounded border border-ink-200 bg-white px-1.5 py-0.5 font-mono">esc</kbd> to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}
