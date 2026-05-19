import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Changelog — Sokoni" };

type Entry = {
  date: string;
  version: string;
  type: "feature" | "improvement" | "fix";
  title: string;
  bullets: string[];
};

const CHANGELOG: Entry[] = [
  {
    date: "18 May 2026",
    version: "0.14.0",
    type: "feature",
    title: "Mobile dashboard, real translations, notifications",
    bullets: [
      "MobileDashboardBar with hamburger drawer surfaces the full 13-item dashboard nav on phones (was hidden md:flex before)",
      "i18n dictionary expanded across 5 languages: hero, nav, footer, pricing, trust signals, stats, CTAs",
      "Per-locale layout applies dir='rtl' for Arabic + lang attribute; locale-aware Intl formatters (currency, number, date, relative time)",
      "In-product notifications: notifications table + lib/server/notify.ts helper + /api/notifications + /api/notifications/read",
      "NotificationsBell component in both desktop sidebar header and mobile topbar with unread count badge, mark-all-read, deep-link targets",
      "Determinations and certificates fire notifications: marginal warnings, rejection guidance, certificate-issued events"
    ]
  },
  {
    date: "18 May 2026",
    version: "0.13.0",
    type: "feature",
    title: "v1/certificates + v1/shipments, white-label branding, onboarding tour",
    bullets: [
      "POST /api/v1/certificates — key-authed certificate creation returning ref, PDF URL, and QR verification URL",
      "POST /api/v1/shipments — end-to-end pipeline (classify → determine origin → save → optional certificate) at $1.80/call as advertised",
      "Per-workspace white-label branding (Forwarder tier): brand name, logo URL, primary colour, footer note persisted to workspaces.brand_*",
      "Certificate PDF picks up workspace branding when plan is forwarder — accent colour on header rule, brand logo or name, custom footer text",
      "/dashboard/branding with live preview, locked behind Forwarder upsell on lower tiers",
      "/dashboard/settings actually persists workspace name, default origin country, default locale via PATCH /api/workspace",
      "First-run onboarding tour: 5-step walkthrough (welcome, wizard, history, certificates, API keys), localStorage-skipped on subsequent visits"
    ]
  },
  {
    date: "18 May 2026",
    version: "0.12.0",
    type: "feature",
    title: "Public cert verification + QR codes, Vercel Blob, KYB, team invites",
    bullets: [
      "Certificate PDFs now embed a QR code that resolves to /verify/[reference] — a no-auth public verification page customs officers can scan",
      "/verify/[reference] shows authenticated/endorsed status, full trade lane, product details, exporter/consignee, with a 'For customs officers' note",
      "Vercel Blob storage for certificate PDFs: rendered once on issuance, future downloads 302 to the CDN URL",
      "Smile Identity KYB scaffold — business verification across NG/KE/GH/ZA/UG/TZ/RW/CI with callback handler",
      "kyb_* columns on workspaces, /dashboard/verification page with form + status tracking",
      "Real team invitations: 7-day tokens, Resend email with accept link, /accept-invite page, /api/team/invitations CRUD",
      "Dashboard team page shows pending invitations alongside members"
    ]
  },
  {
    date: "18 May 2026",
    version: "0.11.0",
    type: "feature",
    title: "Webhooks, audit log, real account registration",
    bullets: [
      "Webhook endpoints (workspace-scoped) with HMAC-signed delivery, 6-step exponential retry, signature verification examples in dashboard",
      "9-event taxonomy: classification/determination/certificate/workspace lifecycle events",
      "/dashboard/webhooks with create, test, delivery log, enable/disable, revoke",
      "determination.created + certificate.issued events fired automatically from existing API routes",
      "audit_log table with workspace+user attribution, IP, user agent, action taxonomy, 7-year retention plan",
      "/dashboard/activity surfacing every API call, member action, webhook event, billing change",
      "Real /register page with email+password+captcha+strength meter wired to /api/auth/register",
      "Header CTA now routes to /register (waitlist still available at /signup)"
    ]
  },
  {
    date: "18 May 2026",
    version: "0.10.0",
    type: "feature",
    title: "Server-side PDF certificates, AI cache, Stripe portal, CSV bulk",
    bullets: [
      "@react-pdf/renderer wired for AfCFTA Certificate generation — Annex II Appendix I format with all 9 boxes, electronic-endorsement stamp, and footer reference",
      "GET /api/certificates/[id]/pdf streams real PDF buffers for any saved or demo certificate",
      "Upstash-backed cache layer (lib/cache.ts) with in-memory fallback — wraps classifyWithAI for 24h TTL, ~10x Anthropic cost reduction on repeated SKUs",
      "Source field on classification responses (ai | cache | keyword) so callers can see what produced the answer",
      "/api/billing/portal opens Stripe Customer Portal; lazily creates a Stripe customer for new workspaces on first click",
      "/dashboard/bulk — CSV bulk classification with drag-and-drop upload, plan-tiered row limits (5/50/500/2000), preview, results table, and enriched-CSV download",
      "Per-row persistence into the determinations history so bulk classifications appear alongside one-off shipments"
    ]
  },
  {
    date: "18 May 2026",
    version: "0.9.0",
    type: "feature",
    title: "Real SaaS dashboard + v1 public API + workspace persistence",
    bullets: [
      "Dashboard rebuild with sidebar nav: Overview, Determinations, Certificates, Bulk, API Keys, Team, Billing, Settings",
      "getSessionUser() helper with workspace auto-provisioning and coherent demo fallback",
      "Wizard outputs persist to /api/determinations on step 3 (fire-and-forget)",
      "API key management: sk_(live|test)_<24> format, SHA-256 hash at rest, constant-time compare, one-time plaintext reveal",
      "v1 public API with key auth + usage logging: /api/v1/classify, /api/v1/determine-origin, /api/v1/tariff",
      "Per-key rate limiting at 60 req/min via Upstash",
      "Demo data set (5 determinations, 3 certificates, 2 API keys) so every dashboard page renders without a database"
    ]
  },
  {
    date: "18 May 2026",
    version: "0.8.0",
    type: "feature",
    title: "Launch-blocker batch: email, real auth, rate limits, captcha, Sentry, cron",
    bullets: [
      "Resend wired end-to-end: waitlist confirmations + magic-link auth + certificate-issued emails",
      "Auth.js v5 Drizzle adapter — real sessions persist to Postgres when DATABASE_URL is set",
      "Password hashing with bcryptjs (12 rounds) + safe constant-time demo path",
      "/api/auth/register endpoint with email + bcrypt + captcha + rate-limit",
      "Upstash Ratelimit on /api/classify (20/min), /api/checkout (5/min), /api/waitlist + /api/auth/register (3/10min)",
      "Cloudflare Turnstile invisible CAPTCHA on every public form, server-verified",
      "Sentry @sentry/nextjs wired across client/server/edge with tunnelRoute for ad-blocker resilience",
      "Vercel Cron at /api/cron/cleanup — daily session and verification-token pruning",
      "DEPLOY.md — full Vercel + Neon walkthrough with every env var documented"
    ]
  },
  {
    date: "18 May 2026",
    version: "0.7.0",
    type: "feature",
    title: "Production integrations: AI, auth, billing, DB, docs",
    bullets: [
      "Anthropic Claude integration for HS classification — falls back to keyword classifier without key",
      "Auth.js (next-auth v5) scaffold with credentials + JWT sessions",
      "Postgres + Drizzle ORM schema (users, workspaces, waitlist, determinations, certificates, API keys)",
      "Stripe billing with /api/checkout and webhook handler; pricing CTAs go live on key set",
      "Paystack + Flutterwave wrappers for African payment methods (cards, mobile money, bank transfer)",
      "Resend-ready waitlist API with Slack webhook notifications",
      "13-page /docs site with concepts, AfriOrigin, and API guides",
      "Cookie consent banner with localStorage + cookie persistence",
      "Security headers via middleware (X-Content-Type-Options, Referrer-Policy, Permissions-Policy)"
    ]
  },
  {
    date: "18 May 2026",
    version: "0.6.0",
    type: "feature",
    title: "Pre-launch hardening — legal, auth stub, SEO, mobile",
    bullets: [
      "/terms, /privacy, /security, /contact legal pages",
      "/about with mission, values, founding team, partner wall",
      "/status (8 systems, 99.9%+ uptime) and /changelog",
      "Mobile hamburger menu replacing overflowing desktop nav",
      "/signup waitlist flow with API + Slack hook stubs",
      "Programmatic /icon favicon and /opengraph-image OG card",
      "robots.txt + sitemap.xml + JSON-LD Organization/SoftwareApplication structured data",
      "Vercel Analytics, global loading.tsx and error.tsx boundaries"
    ]
  },
  {
    date: "18 May 2026",
    version: "0.5.0",
    type: "feature",
    title: "Live African commodity map",
    bullets: [
      "Interactive Africa map built on Natural Earth polygons, projected with d3-geo",
      "Click any country to see its tradable commodities, prices, and rank",
      "Pick a commodity to highlight its top African producers with market-share bars",
      "Live price simulation with 24-point sparklines per commodity, streaming every 3.5s"
    ]
  },
  {
    date: "16 May 2026",
    version: "0.4.0",
    type: "feature",
    title: "AfriOrigin wizard, pricing, and developer API",
    bullets: [
      "Three-step compliance wizard: classify → origin determination → savings + Certificate",
      "Pricing page with four tiers (Free / Pro SME / SME Bulk / Forwarder) + per-call API",
      "Developer documentation with sample curl, JSON, and webhook taxonomy",
      "TradeOS architecture diagram naming PAPSS, PACM, ADAPT, and Customs as public rails",
      "i18n scaffolding across English, French, Portuguese, Arabic, and Swahili"
    ]
  },
  {
    date: "14 May 2026",
    version: "0.3.0",
    type: "feature",
    title: "AfCFTA toolkit and Rules of Origin reference",
    bullets: [
      "Tariff calculator with MFN vs preferential rate comparison",
      "Rules of Origin reference by HS chapter",
      "Digital trade document templates aligned with the 2025 AU Digital Trade Protocol"
    ]
  },
  {
    date: "12 May 2026",
    version: "0.2.0",
    type: "feature",
    title: "Marketplace, suppliers, commodities, logistics — roadmap previews",
    bullets: [
      "Marketplace with category filters and AfCFTA-rate preview per listing",
      "KYB-tiered supplier directory (Basic → Platinum)",
      "Pan-African commodity benchmarks with top-producer mapping",
      "Corridor-aware logistics and customs broker directory"
    ]
  },
  {
    date: "10 May 2026",
    version: "0.1.0",
    type: "feature",
    title: "Sokoni v0 — research-backed platform skeleton",
    bullets: [
      "Initial site with research summary and primary sources",
      "Buyer dashboard with PAPSS-savings widget and order tracking",
      "Branding and design system (terracotta / savanna / sand)"
    ]
  }
];

const TYPE_TONE = {
  feature: "terracotta",
  improvement: "info",
  fix: "warn"
} as const;

export default function ChangelogPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-20">
        <Badge tone="terracotta">Changelog</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          What&apos;s new on Sokoni.
        </h1>
        <p className="mt-2 text-ink-700">
          We ship in public. Every meaningful change to the platform is recorded here.
        </p>

        <ol className="mt-10 space-y-8">
          {CHANGELOG.map((e) => (
            <li
              key={e.version}
              className="relative rounded-2xl border border-ink-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={TYPE_TONE[e.type]}>{e.type}</Badge>
                  <span className="font-mono text-xs text-ink-500">v{e.version}</span>
                </div>
                <span className="text-xs text-ink-500">{e.date}</span>
              </div>
              <h2 className="mt-3 font-display text-xl font-semibold">{e.title}</h2>
              <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                {e.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-terracotta-500" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
