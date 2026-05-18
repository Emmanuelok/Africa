# Sokoni — Africa's Trade Engine

A unified B2B trade platform purpose-built for the **African Continental Free Trade Area (AfCFTA)**: 1.3 billion people, 54 states, $3.4T GDP.

> Intra-African trade is stuck at ~16-17%. Asia is 59%, Europe 68%. Sokoni is the open TradeOS stack for the AfCFTA market — and **AfriOrigin** is module one.

## The wedge: AfriOrigin

The product SMEs pay for today:

- **AI HS-code classification** from a free-text product description
- **AfCFTA Rules of Origin** determination with plain-language reasoning
- **Tariff savings calculator** — MFN vs AfCFTA preferential, exact USD savings
- **Certificate of Origin PDF** in Annex II Appendix I format, accepted under the 2025 AU Digital Trade Protocol
- **Five languages**: English, French, Portuguese, Arabic, Swahili
- **Developer API** to embed compliance into ERPs, freight, and e-commerce
- **Pricing**: Free / $49 Pro SME / $149 SME Bulk / $299 Forwarder / API from $0.10/call

## Surface map

| Path | What it is |
| --- | --- |
| `/` | Landing — AfriOrigin hero, 3-step explainer, pain points, TradeOS vision |
| **`/afriorigin`** | **3-step compliance wizard** (classify → origin determination → savings + CoO) |
| `/afriorigin/certificate` | Printable AfCFTA Certificate of Origin |
| `/pricing` | 4 SaaS tiers + API pricing |
| `/developers` | REST API docs, webhooks, TradeOS architecture diagram |
| `/afcfta` | Standalone tariff calculator + Rules of Origin reference |
| `/[locale]` | Localized landing (`/fr`, `/pt`, `/ar`, `/sw`) |
| `/marketplace`, `/[id]` | **Roadmap preview** — listings filtered by AfCFTA category |
| `/suppliers` | **Roadmap preview** — KYB-tiered supplier directory |
| `/commodities` | **Roadmap preview** — pan-African commodity benchmarks |
| `/logistics` | **Roadmap preview** — corridor-aware forwarders & customs brokers |
| `/dashboard` | Buyer dashboard mock with PAPSS savings |
| `/research` | Findings + primary sources |

## Architecture: TradeOS for Africa

```
Distribution layer  → WhatsApp · Marketplaces (Jumia, Afrimart, Matta) · Direct web/mobile/USSD
                                          ↓
TradeOS (open stack) → Identity · Discovery · COMPLIANCE (AfriOrigin) · Payments · Logistics · Finance
                                          ↓
Public rails        → PAPSS · PACM · ADAPT · Customs
```

AfriOrigin is the wedge. Once an SME's identity, shipment history, and buyer relationships are on Sokoni, the rest of the stack runs on the same verified-business graph.

## Stack

- **Next.js 14.2** App Router (RSC + client islands)
- **React 18** + **TypeScript** strict
- **Tailwind CSS v3** with African-inspired palette (terracotta / savanna / sand)
- **lucide-react** icons, **Inter** + **Fraunces** fonts
- Zero database — typed mock data in `lib/data/*` so the app deploys to Vercel with no config

## Local dev

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel

The repo is Vercel-ready with **zero config and no env vars**.

1. Push the branch `claude/african-trade-platform-research-tsrs7` (already done).
2. In Vercel: **Add New → Project → Import from Git**.
3. Pick this repo. Framework auto-detects **Next.js**.
4. Click Deploy. Each push to the branch ships a preview URL.

Or via CLI:

```bash
npm i -g vercel
vercel        # preview deploy
vercel --prod # production deploy
```

## What v2 wires in

- **Anthropic Claude API** for production-grade HS classification + plain-language RoO reasoning across 5 languages
- **KYB pipeline** via Smile ID / Stripe Identity against national company registries
- **PAPSS API** for live FX quotes and settlement initiation
- **Customs API integration** (ASYCUDA, used in 40+ African states)
- **Live commodity feeds** — Refinitiv, S&P Platts, ECX, GCX, JSE
- **Postgres + Drizzle ORM** for tenants, determinations, certificates, audit trail
- **Paystack / Flutterwave / Stripe** payments for the SaaS tiers
- **Real PDF generation** with WeasyPrint, embedded QR for certificate verification
- **next-intl** for full translation across all routes (scaffolding ready in `lib/i18n/locales.ts`)

## License

Source-available under a permissive license to be finalized. Trade data and tariff schedules are derived from publicly published AfCFTA national schedules and WCO HS 2022.
