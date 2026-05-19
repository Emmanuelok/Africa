import Link from "next/link";
import {
  FileText,
  ShoppingBag,
  Building2,
  Globe2,
  TrendingUp,
  Layout,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { search, type SearchResult } from "@/lib/search/index";

export const dynamic = "force-dynamic";

export const metadata = { title: "Search — Sokoni" };

const ICONS: Record<SearchResult["kind"], React.ElementType> = {
  doc: FileText,
  marketplace: ShoppingBag,
  supplier: Building2,
  country: Globe2,
  commodity: TrendingUp,
  page: Layout
};

const LABELS: Record<SearchResult["kind"], string> = {
  doc: "Docs",
  marketplace: "Marketplace",
  supplier: "Supplier",
  country: "Country",
  commodity: "Commodity",
  page: "Page"
};

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams?.q ?? "").trim();
  const results = q ? search(q, 50) : [];

  // Group results by kind for the section layout
  const grouped: Record<SearchResult["kind"], SearchResult[]> = {
    doc: [],
    page: [],
    marketplace: [],
    supplier: [],
    country: [],
    commodity: []
  };
  for (const r of results) grouped[r.kind].push(r);

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
        <Badge tone="terracotta">Search</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search the platform"}
        </h1>

        <form className="mt-6" action="/search">
          <input
            type="search"
            name="q"
            defaultValue={q}
            autoFocus={!q}
            placeholder="Try coffee, Kenya, certificate, webhook…"
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-base focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          />
        </form>

        {q && results.length === 0 && (
          <Card className="mt-8 text-center">
            <p className="text-ink-600">
              Nothing matched <strong>{q}</strong>. Try a different keyword, or browse{" "}
              <Link href="/docs" className="text-terracotta-700 hover:underline">the docs</Link>.
            </p>
          </Card>
        )}

        {!q && (
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              { label: "AfCFTA", href: "/docs/concepts/afcfta" },
              { label: "Rules of Origin", href: "/docs/concepts/rules-of-origin" },
              { label: "PAPSS settlement", href: "/docs/concepts/papss" },
              { label: "Certificate format", href: "/docs/afriorigin/certificates" },
              { label: "API authentication", href: "/docs/api/authentication" },
              { label: "Webhook signatures", href: "/docs/api/webhooks" }
            ].map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="flex items-center justify-between rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm transition-colors hover:border-terracotta-300 hover:bg-terracotta-50"
              >
                <span className="font-medium">{s.label}</span>
                <ArrowRight className="h-4 w-4 text-ink-400" />
              </Link>
            ))}
          </div>
        )}

        {q && results.length > 0 && (
          <div className="mt-8 space-y-8">
            {(Object.keys(grouped) as SearchResult["kind"][]).map((kind) => {
              const items = grouped[kind];
              if (items.length === 0) return null;
              return (
                <section key={kind}>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
                    {LABELS[kind]} ({items.length})
                  </h2>
                  <ul className="space-y-2">
                    {items.map((r) => {
                      const Icon = ICONS[r.kind];
                      return (
                        <li key={r.id}>
                          <Link
                            href={r.href}
                            className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-4 transition-colors hover:border-terracotta-300 hover:shadow-sm"
                          >
                            <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-700">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-ink-900">{r.title}</div>
                              <div className="mt-1 text-sm text-ink-600">{r.description}</div>
                              <div className="mt-1 font-mono text-xs text-ink-400">{r.href}</div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
