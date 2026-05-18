# Sokoni — Africa's Trade Engine

A unified B2B trade platform purpose-built for the **African Continental Free Trade Area (AfCFTA)**: 1.3 billion people, 54 states, $3.4T GDP.

> Intra-African trade is stuck at ~16-17%. Asia is 59%, Europe 68%. Sokoni stitches together discovery, verification, PAPSS-ready payments, AfCFTA tariff intelligence, digital trade docs, and corridor-aware logistics — all on one platform.

## What's in this MVP

| Surface | Path | What it shows |
| --- | --- | --- |
| Landing | `/` | Pain points, solution, live commodity ticker |
| Marketplace | `/marketplace` | 12 listings across 10 verified suppliers, filterable |
| Product detail | `/marketplace/[id]` | Specs, supplier, **AfCFTA tariff preview** vs MFN |
| Suppliers | `/suppliers` | KYB-tiered supplier directory |
| Commodities | `/commodities` | Pan-African price benchmarks |
| **AfCFTA Toolkit** | `/afcfta` | **Interactive tariff calculator** + Rules of Origin + e-doc templates |
| Logistics | `/logistics` | Corridor-aware freight & customs partners |
| Dashboard | `/dashboard` | Buyer dashboard with PAPSS savings, RFQs, orders |
| Research | `/research` | Findings + sources behind the design |

## Stack

- **Next.js 14** App Router (RSC) + **React 18** + **TypeScript**
- **Tailwind CSS v3** with an African-inspired palette (terracotta / savanna / sand)
- **lucide-react** icons, **Inter** + **Fraunces** fonts
- Zero database — typed mock data in `lib/data/*` so the app deploys cleanly to Vercel out of the box

## Local dev

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel

The repo is Vercel-ready with zero config.

1. Push the branch (already named `claude/african-trade-platform-research-tsrs7`).
2. On Vercel: **Add New → Project → Import from Git**.
3. Pick this repo; framework auto-detects **Next.js**. No env vars needed.
4. Deploy. Each push to the branch ships a preview URL.

Or with the CLI:

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production deploy
```

## What "v2" looks like

Real production rollout would wire in:

- **Auth + KYB pipeline** (Stripe Identity / Smile ID for African company-registry verification)
- **PAPSS API integration** (live FX quotes + initiation of settlement)
- **Customs API integration** (ASYCUDA in 40+ African states)
- **Real commodity feeds** (Refinitiv, S&P Global Platts, ECX, GCX, JSE)
- **Postgres + Drizzle ORM** for listings, RFQs, messages, orders
- **i18n** (English, French, Portuguese, Arabic, Swahili)
- **AI matching** (Claude-powered buyer-supplier matching + RFQ auto-translation)

See `app/research/page.tsx` for the evidence base and `lib/data/` for the data model.
