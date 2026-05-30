import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness + dependency probe. Used by Vercel monitoring, Better Stack,
// uptime-kuma, etc. Returns 200 only when configured dependencies are
// reachable; degrades to "ok with warnings" if some optional services are
// missing so demo deploys don't false-positive.
export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: "ok" | "fail" | "skipped"; latencyMs?: number; detail?: string }> = {};

  // App is always alive if this handler runs.
  checks.app = { status: "ok" };

  // Database — optional but if configured, must respond.
  const db = getDb();
  if (db) {
    const dbStart = Date.now();
    try {
      await db.execute(sql`select 1`);
      checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
    } catch (err) {
      checks.database = { status: "fail", detail: err instanceof Error ? err.message : "query failed", latencyMs: Date.now() - dbStart };
    }
  } else {
    checks.database = { status: "skipped", detail: "DATABASE_URL not set" };
  }

  // Upstash Redis (cache + rate limit) — optional.
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const rStart = Date.now();
    try {
      const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        signal: AbortSignal.timeout(2000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      checks.redis = { status: "ok", latencyMs: Date.now() - rStart };
    } catch (err) {
      checks.redis = { status: "fail", detail: err instanceof Error ? err.message : "ping failed", latencyMs: Date.now() - rStart };
    }
  } else {
    checks.redis = { status: "skipped" };
  }

  // Anthropic — surfaced as configured/not-configured (don't burn a token).
  checks.anthropic = { status: process.env.ANTHROPIC_API_KEY ? "ok" : "skipped" };
  checks.stripe = { status: process.env.STRIPE_SECRET_KEY ? "ok" : "skipped" };
  checks.resend = { status: process.env.RESEND_API_KEY ? "ok" : "skipped" };
  checks.blob = { status: process.env.BLOB_READ_WRITE_TOKEN ? "ok" : "skipped" };

  const anyFailed = Object.values(checks).some((c) => c.status === "fail");
  const status = anyFailed ? 503 : 200;

  return NextResponse.json(
    {
      status: anyFailed ? "degraded" : "ok",
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      region: process.env.VERCEL_REGION ?? "local",
      uptimeMs: Math.round(process.uptime() * 1000),
      durationMs: Date.now() - start,
      checks
    },
    {
      status,
      headers: { "Cache-Control": "no-store" }
    }
  );
}
