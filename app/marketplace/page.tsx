import { PRODUCTS } from "@/lib/data/products";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { Search, SlidersHorizontal } from "lucide-react";

const CATEGORIES = Array.from(new Set(PRODUCTS.map((p) => p.category))).sort();

export const metadata = { title: "Marketplace — Sokoni" };

export default function MarketplacePage({
  searchParams
}: {
  searchParams?: { category?: string; q?: string };
}) {
  const activeCat = searchParams?.category ?? "All";
  const q = (searchParams?.q ?? "").toLowerCase().trim();

  let filtered = activeCat === "All" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCat);
  if (q) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="terracotta">Marketplace</Badge>
            <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              {filtered.length} listings across Africa
            </h1>
            <p className="mt-2 text-ink-600">
              Raw materials, commodities, and finished goods — every listing carries an AfCFTA
              preferential-rate preview and KYB-verified supplier.
            </p>
          </div>
        </div>

        {/* Filters */}
        <form className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search cocoa, copper, textiles, fertilizer…"
              className="w-full rounded-lg border border-ink-200 bg-white py-2.5 pl-10 pr-3 text-sm placeholder:text-ink-400 focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-ink-800"
          >
            <SlidersHorizontal className="h-4 w-4" /> Apply
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-2">
          <CatChip current={activeCat} value="All" q={q} />
          {CATEGORIES.map((c) => (
            <CatChip key={c} current={activeCat} value={c} q={q} />
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-600">
            No listings match your filters yet. Try another category or search term.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CatChip({ current, value, q }: { current: string; value: string; q: string }) {
  const active = current === value;
  const params = new URLSearchParams();
  if (value !== "All") params.set("category", value);
  if (q) params.set("q", q);
  const href = `/marketplace${params.toString() ? `?${params}` : ""}`;
  return (
    <a
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-terracotta-600 bg-terracotta-600 text-white"
          : "border-ink-200 bg-white text-ink-700 hover:border-terracotta-400 hover:text-terracotta-700"
      }`}
    >
      {value}
    </a>
  );
}
