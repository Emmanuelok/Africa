# Sokoni — Africa's Trade Engine

A unified B2B trade platform purpose-built for the **African Continental Free Trade Area (AfCFTA)**: 1.3 billion people, 54 states, $3.4T GDP.

> Intra-African trade is stuck at ~16-17%. Asia is 59%, Europe 68%. Sokoni is the open TradeOS stack for the AfCFTA market — and **AfriOrigin** is module one.

## What's here

### Marketing + product surface (59 routes)

- `/` — landing with AfriOrigin hero, 3-step explainer, live commodity teaser, TradeOS vision
- **`/afriorigin`** — interactive 3-step compliance wizard (classify → origin determination → savings + CoO)
- `/afriorigin/certificate` — print-ready AfCFTA Certificate of Origin (Annex II Appendix I)
- `/pricing` — 4 tiers + Stripe checkout (live when configured)
- `/developers` — REST API overview, sample curl, TradeOS diagram
- **`/docs`** — 13-page documentation site (Concepts, AfriOrigin, API)
- `/commodities` — live interactive Africa map (Natural Earth polygons + d3-geo)
- `/afcfta` — standalone tariff calculator + Rules of Origin reference
- `/marketplace`, `/suppliers`, `/logistics` — roadmap previews
- `/about`, `/contact`, `/security`, `/terms`, `/privacy` — full legal + trust pages
- `/status`, `/changelog` — operational transparency
- `/signin`, `/signup` — auth (waitlist by default, real Auth.js when configured)
- `/[locale]` — translated hero pages (FR/PT/AR/SW)

### Integrations (graceful degradation)

Every integration **works without env vars** in a demo/fallback mode, and "comes alive" the moment you set the relevant key.

| Integration | Behaviour without key | Behaviour with key |
| --- | --- | --- |
| **Anthropic Claude** (`ANTHROPIC_API_KEY`) | Wizard uses keyword classifier | Real AI HS classification + plain-language RoO reasoning in 5 languages |
| **Auth.js** (`NEXTAUTH_SECRET`) | `/signin` and `/signup` route to waitlist | Real sessions; demo credentials `demo@sokoni.africa` / `sokoni-demo` |
| **Postgres + Drizzle** (`DATABASE_URL`) | API routes log to console | Waitlist + determinations + certificates persisted |
| **Stripe** (`STRIPE_SECRET_KEY`) | Pricing CTAs route to /signup waitlist | Real checkout; subscriptions; `/api/webhooks/stripe` updates plans |
| **Paystack** (`PAYSTACK_SECRET_KEY`) | Not surfaced | Available via `lib/billing/paystack.ts` |
| **Flutterwave** (`FLUTTERWAVE_SECRET_KEY`) | Not surfaced | Mobile money + card across 30+ African countries via `lib/billing/flutterwave.ts` |
| **Resend** (`RESEND_API_KEY`) | No transactional email | Waitlist confirmations, magic-link auth |
| **Slack webhook** (`WAITLIST_SLACK_WEBHOOK`) | No-op | Waitlist signups posted to your Slack |

Copy `.env.example` to `.env.local` and fill in only what you need.

## Stack

- **Next.js 14.2** App Router (RSC + client islands)
- **React 18** + **TypeScript** strict
- **Tailwind CSS v3** with African-inspired palette
- **d3-geo** + **world-atlas** (Natural Earth) for the Africa map
- **Anthropic SDK** for AI classification
- **Auth.js v5 (next-auth@beta)** for authentication
- **Drizzle ORM + postgres-js** for Postgres access
- **Stripe / Paystack / Flutterwave** for payments
- **@vercel/analytics** for usage analytics
- **lucide-react**, **Inter** + **Fraunces** fonts

## Local dev

```bash
npm install
cp .env.example .env.local   # optional — fill in keys you want to enable
npm run dev
# open http://localhost:3000
```

## Database setup (optional)

```bash
# Set DATABASE_URL in .env.local (Vercel Postgres / Neon / Supabase / Railway)
npx drizzle-kit generate    # create migration files in lib/db/migrations
npx drizzle-kit push        # apply schema to DB (dev only)
# Production: use drizzle-kit migrate or run SQL manually
```

Schema: `lib/db/schema.ts` defines tables for users, sessions, workspaces, waitlist, determinations, certificates, API keys, and API usage.

## Deploy to Vercel

The repo is Vercel-ready. **All env vars are optional** — deploy without any of them and the marketing site + waitlist + map all work.

1. **Add New → Project → Import from Git** on Vercel
2. Pick the repo. Framework auto-detects Next.js.
3. (Optional) Add env vars from `.env.example` for the integrations you want live.
4. Deploy.

`prebuild` regenerates `lib/data/africa-geo.json` from world-atlas on every deploy so the Natural Earth geometry stays in sync.

## CLI

```bash
vercel        # preview deploy
vercel --prod # production deploy
```

## What ships next (post-v1)

- **Real-time PAPSS API** when it opens (announced Q3 2026)
- **OAuth 2.0** for third-party app access
- **Customs filing integrations** with ASYCUDA-based national authorities
- **Live commodity feeds** — Refinitiv, S&P Platts, ECX, GCX, JSE
- **Tokenized trade finance** module (TradeOS layer)

See `/changelog` for what landed when and `/docs` for the working manual.

## License

Source-available under a permissive license to be finalized. Trade data is derived from publicly published AfCFTA national schedules and WCO HS 2022.
