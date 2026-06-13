# Deploying Sokoni to Vercel + Neon

End-to-end walkthrough from this branch to a production `.africa` domain with real auth, real billing, real AI, real email, real captcha, real error monitoring, and real cron.

Estimated time: **~30 minutes.** Zero env vars set → site is live in demo mode. Each env var below unlocks one integration.

---

## 1. Vercel project (3 min)

1. Sign in at [vercel.com](https://vercel.com).
2. **Add New → Project → Import Git Repository.**
3. Pick this repo, branch `claude/african-trade-platform-research-tsrs7`.
4. Framework auto-detects Next.js. Click **Deploy.**

First deploy succeeds with **zero env vars** — the site renders in demo mode immediately. The next steps progressively enable production features.

---

## 2. Postgres via Neon Marketplace (2 min)

1. In the Vercel project: **Storage → Create → Marketplace Database → Neon.**
2. Region: `aws-us-east-1` (closest to Cape Town until Neon adds AF) or `aws-eu-central-1` for Europe-edge.
3. Neon auto-injects `DATABASE_URL` as a Vercel env var.

### Push the schema

```bash
# One-time local setup
npm i -g vercel
vercel link        # link local clone to your Vercel project
vercel env pull    # writes .env.local with DATABASE_URL

# Apply versioned SQL migrations (recommended for production — reviewable,
# reproducible, and won't silently drop columns)
npm run db:migrate
```

This applies `lib/db/migrations/*.sql` and records them in a
`__drizzle_migrations` table, so re-running is safe and idempotent. **Run
`npm run db:migrate` as part of every deploy** after pulling new migrations.

When you change `lib/db/schema.ts`, generate a new migration with
`npm run db:generate` and commit the resulting SQL file. For throwaway local
experiments only, `npm run db:push` syncs the schema directly without a
migration file.

20 tables get created, covering auth (`users`, `accounts`, `sessions`,
`verification_tokens`), workspaces + membership + invitations, billing/KYB
columns, `determinations`, `certificates`, `api_keys`, `api_usage`,
`webhook_endpoints`/`webhook_deliveries`, `notifications` +
`notification_preferences`, `audit_log`, `bulk_jobs`, `suppressed_emails`,
and `waitlist`.

---

## 3. Auth (3 min)

In Vercel → **Settings → Environment Variables:**

```
NEXTAUTH_SECRET=<output of: openssl rand -base64 32>
NEXTAUTH_URL=https://<your-vercel-domain>
```

Redeploy. `/signin` now persists real sessions to Postgres. Without DB it falls back to JWT-only with a demo account (`demo@sokoni.africa` / `sokoni-demo`).

---

## 4. Email — Resend (2 min)

1. Sign up at [resend.com](https://resend.com), verify a sending domain (`sokoni.africa`).
2. Create an API key.
3. Set in Vercel:

```
RESEND_API_KEY=re_...
EMAIL_FROM=Sokoni <hello@sokoni.africa>
```

This enables:
- Waitlist confirmation emails
- Auth.js magic-link sign-in (auto-added when both `RESEND_API_KEY` and `DATABASE_URL` are set)
- Certificate-issued notifications

---

## 5. AI — Anthropic (1 min)

```
ANTHROPIC_API_KEY=sk-ant-...
```

The `/api/classify` route now uses Claude Sonnet 4.6 for HS classification instead of the keyword fallback.

---

## 6. Captcha — Cloudflare Turnstile (2 min)

1. [dash.cloudflare.com → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) → **Add site.**
2. Add `sokoni.africa` (and `*.vercel.app` for previews). Widget mode: **Invisible.**
3. Set in Vercel:

```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
TURNSTILE_SECRET_KEY=0x4AAA...
```

Waitlist + register forms now silently challenge bots. Without these keys, captcha verification passes through (open).

---

## 7. Rate limiting — Upstash (2 min)

1. Sign up at [upstash.com](https://upstash.com) → **Create Database → Redis → Global.**
2. Copy the **REST URL** and **REST Token** from the dashboard.
3. Set in Vercel:

```
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

Rate limits go live immediately:
- `/api/classify` → 20 req/min/IP (protects Anthropic spend)
- `/api/checkout` → 5 req/min/IP
- `/api/waitlist` → 3 req/10min/IP
- `/api/auth/register` → 3 req/10min/IP

Vercel KV also works — same Redis API. Use whichever is cheaper for your traffic.

---

## 8. Sentry error monitoring (3 min)

1. Sign up at [sentry.io](https://sentry.io) → **Create Project → Next.js.**
2. Copy the DSN.
3. Set in Vercel:

```
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=<same value>
SENTRY_ORG=<your-org-slug>
SENTRY_PROJECT=sokoni
SENTRY_AUTH_TOKEN=<from Sentry settings → Auth Tokens>
```

`SENTRY_AUTH_TOKEN` lets Vercel upload source maps on every deploy so stack traces are readable. `tunnelRoute: /monitoring` is configured so ad-blockers don't drop reports.

---

## 9. Billing — Stripe (5 min)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → **Products → Create:**
   - **Pro SME** — $49/month recurring → note `price_xxx`
   - **SME Bulk** — $149/month → note `price_xxx`
   - **Forwarder** — $299/month → note `price_xxx`
2. Set in Vercel:

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_PRO_SME=price_...
STRIPE_PRICE_SME_BULK=price_...
STRIPE_PRICE_FORWARDER=price_...
```

3. **Stripe Dashboard → Developers → Webhooks → Add endpoint:**
   - URL: `https://sokoni.africa/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET`.

Pricing CTAs now open live Stripe Checkout.

---

## 10. African payments — Paystack + Flutterwave (5 min, optional)

Most African SME revenue will flow through these, not Stripe. Wire whichever your customers prefer.

**Paystack** (NG, GH, KE, ZA):
```
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
```

**Flutterwave** (30+ countries, mobile money, M-Pesa, MTN MoMo):
```
FLUTTERWAVE_SECRET_KEY=FLWSECK-...
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-...
```

Wrappers are in `lib/billing/paystack.ts` and `lib/billing/flutterwave.ts`. Wire to your checkout flow when ready.

---

## 11. Cron — Vercel daily cleanup (1 min)

1. Generate a secret: `openssl rand -hex 32`
2. Set in Vercel: `CRON_SECRET=<the secret>`

`vercel.json` already declares the daily cron at `03:00 UTC` hitting `/api/cron/cleanup`. It prunes expired sessions and verification tokens. Vercel signs the request with the secret.

---

## 12. Custom domain (3 min)

1. Vercel **Settings → Domains** → add `sokoni.africa`.
2. Add the DNS records Vercel shows you at your registrar.
3. Update env: `NEXT_PUBLIC_SITE_URL=https://sokoni.africa` and `NEXTAUTH_URL=https://sokoni.africa`. Redeploy so robots/sitemap/OG image/magic links use the right URL.
4. SSL auto-provisions via Let's Encrypt within ~60 seconds.

---

## 13. Vercel Analytics + Speed Insights (1 min)

In Vercel project: **Analytics → Enable** and **Speed Insights → Enable.** Both free, both already integrated in code. Web Vitals + privacy-friendly page-view analytics light up immediately.

---

## Cost cheat sheet

| Stage | Monthly |
|---|---|
| Demo (no keys) | **$0** |
| Pre-revenue with all integrations | **$0** — every service has a free tier covering low-traffic prod |
| First 100 paying SMEs | **~$30-50** — Vercel Pro ($20) + Neon Launch ($19) + minor usage |
| 1,000 paying SMEs | **~$200-400** — Vercel Pro, Neon Scale, Anthropic ~$50, Sentry, Resend, Stripe % |
| 10,000 paying SMEs | **~$1,500-3,000** — start negotiating Vercel/Neon enterprise |

---

## What you can do right now

- Deploy to Vercel with **zero env vars** — site goes live in demo mode. Test the wizard, the map, the docs.
- Set `DATABASE_URL` + `NEXTAUTH_SECRET` → real accounts work.
- Set `RESEND_API_KEY` → real emails go out.
- Set `ANTHROPIC_API_KEY` → AI classification activates.
- Set `STRIPE_*` → live billing.

Each env var is independent. Set them in whatever order matches your launch sequence.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `/signin` says credentials invalid | DB doesn't have a `passwordHash` set — register first via `POST /api/auth/register` |
| Anthropic calls 429-rate-limited | Tune the preset in `lib/ratelimit.ts` — `classify: { requests: 20, window: "1 m" }` |
| Magic-link emails don't arrive | Verify your sending domain in Resend; check `EMAIL_FROM` matches a verified domain |
| Stripe webhook signature fails | `STRIPE_WEBHOOK_SECRET` mismatch — copy from the specific webhook endpoint, not the test-mode default |
| Turnstile widget invisible | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` not set, or your domain isn't whitelisted in Cloudflare |
| Cron 401s | `CRON_SECRET` mismatch or not set in Vercel |

See `/docs` for product/API documentation, `/status` for system health, and `/changelog` for what shipped when.
