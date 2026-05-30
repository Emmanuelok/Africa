// Static search index built from existing data sources. No external service —
// the corpus is small enough (~200 docs) that a simple in-memory index is faster
// than any hosted alternative.

import { PRODUCTS } from "@/lib/data/products";
import { SUPPLIERS } from "@/lib/data/suppliers";
import { COUNTRIES } from "@/lib/data/countries";
import { COMMODITIES } from "@/lib/data/commodities";

export type SearchResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  kind: "doc" | "marketplace" | "supplier" | "country" | "commodity" | "page";
  score?: number;
};

// Hard-coded docs index (matches the routes we ship under /docs).
const DOCS: SearchResult[] = [
  { id: "docs-index", kind: "doc", title: "Documentation", href: "/docs", description: "Overview of AfriOrigin, the public API, and AfCFTA concepts." },
  { id: "docs-quickstart", kind: "doc", title: "Quickstart", href: "/docs/getting-started", description: "Run your first AfCFTA determination in 60 seconds." },
  { id: "docs-afcfta", kind: "doc", title: "What is AfCFTA?", href: "/docs/concepts/afcfta", description: "The African Continental Free Trade Area: 54 states, $3.4T GDP, tariff categories, RoO." },
  { id: "docs-roo", kind: "doc", title: "Rules of Origin", href: "/docs/concepts/rules-of-origin", description: "Wholly Obtained, CTH, Regional Value Content, yarn-forward, cumulation." },
  { id: "docs-papss", kind: "doc", title: "PAPSS — Pan-African Payments", href: "/docs/concepts/papss", description: "Cross-border settlement in local currencies — no USD round-trip." },
  { id: "docs-classify", kind: "doc", title: "HS classification", href: "/docs/afriorigin/classify", description: "How AfriOrigin classifies products to HS-4 codes with AI + keyword fallback." },
  { id: "docs-origin", kind: "doc", title: "Origin determination", href: "/docs/afriorigin/origin-determination", description: "The decision tree by HS chapter; marginal cases and product-specific rules." },
  { id: "docs-certs", kind: "doc", title: "Certificates of Origin", href: "/docs/afriorigin/certificates", description: "AfCFTA Annex II Appendix I PDFs with QR verification." },
  { id: "docs-languages", kind: "doc", title: "Languages", href: "/docs/afriorigin/languages", description: "Five languages: EN, FR, PT, AR, SW with RTL support." },
  { id: "docs-api", kind: "doc", title: "API overview", href: "/docs/api", description: "REST + JSON endpoints, per-call pricing, OpenAPI spec." },
  { id: "docs-api-auth", kind: "doc", title: "API authentication", href: "/docs/api/authentication", description: "Bearer tokens, sk_live_ / sk_test_, key rotation, OAuth roadmap." },
  { id: "docs-webhooks", kind: "doc", title: "API webhooks", href: "/docs/api/webhooks", description: "Event taxonomy, HMAC signing, retry policy, signature verification." },
  { id: "docs-errors", kind: "doc", title: "API errors & rate limits", href: "/docs/api/errors", description: "Status codes, error codes, plan-tier limits, idempotency keys." }
];

// Top-level pages worth surfacing in search.
const PAGES: SearchResult[] = [
  { id: "page-home", kind: "page", title: "Sokoni — Africa's Trade Engine", href: "/", description: "AfCFTA compliance in seconds for African SMEs." },
  { id: "page-afriorigin", kind: "page", title: "AfriOrigin wizard", href: "/afriorigin", description: "Classify, determine origin, calculate savings, generate certificate." },
  { id: "page-pricing", kind: "page", title: "Pricing", href: "/pricing", description: "Free, Pro SME, SME Bulk, Forwarder tiers + per-call developer API." },
  { id: "page-developers", kind: "page", title: "Developer API", href: "/developers", description: "Embed AfCFTA compliance in your ERP, freight, or e-commerce stack." },
  { id: "page-commodities", kind: "page", title: "Live Africa Map", href: "/commodities", description: "Interactive map of African commodity production and trade." },
  { id: "page-afcfta", kind: "page", title: "AfCFTA Reference", href: "/afcfta", description: "Tariff calculator + Rules of Origin reference." },
  { id: "page-marketplace", kind: "page", title: "Marketplace", href: "/marketplace", description: "Cross-border B2B trade between African SMEs." },
  { id: "page-suppliers", kind: "page", title: "Suppliers", href: "/suppliers", description: "KYB-verified supplier directory." },
  { id: "page-logistics", kind: "page", title: "Logistics", href: "/logistics", description: "Corridor-aware customs brokers and freight forwarders." },
  { id: "page-research", kind: "page", title: "Research", href: "/research", description: "Source-cited market research underpinning Sokoni." },
  { id: "page-about", kind: "page", title: "About", href: "/about", description: "Mission, team, partners." },
  { id: "page-security", kind: "page", title: "Security", href: "/security", description: "Data residency, encryption, sub-processors, compliance roadmap." },
  { id: "page-status", kind: "page", title: "Status", href: "/status", description: "System status and incident history." },
  { id: "page-changelog", kind: "page", title: "Changelog", href: "/changelog", description: "What's new on Sokoni." },
  { id: "page-contact", kind: "page", title: "Contact", href: "/contact", description: "Get in touch — segmented inboxes per topic." }
];

function buildIndex(): SearchResult[] {
  const products: SearchResult[] = PRODUCTS.map((p) => ({
    id: `product-${p.id}`,
    kind: "marketplace" as const,
    title: p.name,
    href: `/marketplace/${p.id}`,
    description: `${p.category} · ${p.origin} · From ${p.pricePerUnit} ${p.currency}/${p.unit} · MOQ ${p.moq}`
  }));

  const suppliers: SearchResult[] = SUPPLIERS.map((s) => ({
    id: `supplier-${s.id}`,
    kind: "supplier" as const,
    title: s.name,
    href: `/suppliers`,
    description: `${s.city}, ${s.country} · KYB ${s.kybLevel} · ${s.categories.join(", ")}`
  }));

  const countries: SearchResult[] = COUNTRIES.map((c) => ({
    id: `country-${c.code}`,
    kind: "country" as const,
    title: c.name,
    href: `/commodities?country=${c.code}`,
    description: `${c.flag} ${c.code} · ${c.region} Africa · ${c.currency}${c.papssLive ? " · PAPSS live" : ""}`
  }));

  const commodities: SearchResult[] = COMMODITIES.map((c) => ({
    id: `commodity-${c.symbol}`,
    kind: "commodity" as const,
    title: c.name,
    href: `/commodities?commodity=${c.symbol}`,
    description: `${c.category} · ${c.price} USD/${c.unit} · HS ${c.hsCode} · Top: ${c.topProducers.slice(0, 3).join(", ")}`
  }));

  return [...PAGES, ...DOCS, ...commodities, ...countries, ...suppliers, ...products];
}

let cached: SearchResult[] | null = null;

function getIndex(): SearchResult[] {
  if (!cached) cached = buildIndex();
  return cached;
}

// Substring + token + fuzzy scoring. Plenty for an ~200-doc corpus.
// Tokens missing from haystack are forgiven once per query when their best
// Levenshtein distance to any haystack word is within the allowed budget —
// protects against typos and transpositions like "afctfa" or "orign".
function maxAllowedEdits(tokenLen: number): number {
  if (tokenLen <= 3) return 0;
  if (tokenLen <= 5) return 1;
  if (tokenLen <= 8) return 2;
  return 3;
}

export function search(query: string, limit = 12): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const tokens = q.split(/\s+/).filter(Boolean);
  const idx = getIndex();
  const results: Array<SearchResult & { score: number }> = [];

  for (const item of idx) {
    const titleLc = item.title.toLowerCase();
    const descLc = item.description.toLowerCase();
    const hay = `${titleLc} ${descLc}`;
    const hayWords = hay.split(/[\s.,/():?"]+/).filter(Boolean);
    let score = 0;
    let fuzzyMissesUsed = 0;
    let dropped = false;

    for (const tok of tokens) {
      const exact = hay.includes(tok);
      if (titleLc === tok) score += 100;
      if (titleLc.startsWith(tok)) score += 30;
      if (titleLc.includes(tok)) score += 15;
      if (descLc.includes(tok)) score += 5;

      if (!exact) {
        // One fuzzy miss per query allowed: nearest haystack word within
        // a length-scaled Levenshtein budget.
        if (fuzzyMissesUsed === 0 && tok.length >= 3) {
          const budget = maxAllowedEdits(tok.length);
          const matched = hayWords.some((w) => {
            if (!w || Math.abs(w.length - tok.length) > budget) return false;
            return levenshtein(tok, w, budget) <= budget;
          });
          if (matched) {
            score += 8;
            fuzzyMissesUsed += 1;
            continue;
          }
        }
        dropped = true;
        break;
      }
    }

    if (!dropped && score > 0) results.push({ ...item, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// Standard Levenshtein with early exit when the current row's minimum exceeds
// the budget. O(a*b) worst case but the bail-out keeps fuzzy search cheap.
function levenshtein(a: string, b: string, budget: number): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > budget) return budget + 1;

  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;

  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    let rowMin = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > budget) return budget + 1;
    [prev, curr] = [curr, prev];
  }

  return prev[bl];
}
