import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";

export type CheckStatus = "ok" | "fail" | "skipped";
export type Check = { status: CheckStatus; latencyMs?: number; detail?: string };
export type HealthReport = {
  status: "ok" | "degraded";
  version: string;
  environment: string;
  region: string;
  uptimeMs: number;
  durationMs: number;
  checks: Record<string, Check>;
};

// Shared liveness + dependency probe used by /api/health and the public
// /status page. `deep` adds an Anthropic reachability check (a few hundred ms).
export async function runHealthChecks(deep = false): Promise<HealthReport> {
  const start = Date.now();
  const checks: Record<string, Check> = {};

  checks.app = { status: "ok" };

  const db = getDb();
  if (db) {
    const t = Date.now();
    try {
      await db.execute(sql`select 1`);
      checks.database = { status: "ok", latencyMs: Date.now() - t };
    } catch (err) {
      checks.database = { status: "fail", detail: err instanceof Error ? err.message : "query failed", latencyMs: Date.now() - t };
    }
  } else {
    checks.database = { status: "skipped", detail: "DATABASE_URL not set" };
  }

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const t = Date.now();
    try {
      const res = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        signal: AbortSignal.timeout(2000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      checks.redis = { status: "ok", latencyMs: Date.now() - t };
    } catch (err) {
      checks.redis = { status: "fail", detail: err instanceof Error ? err.message : "ping failed", latencyMs: Date.now() - t };
    }
  } else {
    checks.redis = { status: "skipped" };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    if (deep) {
      const t = Date.now();
      try {
        const res = await fetch("https://api.anthropic.com/v1/models?limit=1", {
          headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
          signal: AbortSignal.timeout(4000)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        checks.anthropic = { status: "ok", latencyMs: Date.now() - t };
      } catch (err) {
        checks.anthropic = { status: "fail", detail: err instanceof Error ? err.message : "probe failed", latencyMs: Date.now() - t };
      }
    } else {
      checks.anthropic = { status: "ok" };
    }
  } else {
    checks.anthropic = { status: "skipped" };
  }

  checks.stripe = { status: process.env.STRIPE_SECRET_KEY ? "ok" : "skipped" };
  checks.resend = { status: process.env.RESEND_API_KEY ? "ok" : "skipped" };
  checks.blob = { status: process.env.BLOB_READ_WRITE_TOKEN ? "ok" : "skipped" };
  checks.queue = { status: process.env.QSTASH_TOKEN ? "ok" : "skipped" };

  const anyFailed = Object.values(checks).some((c) => c.status === "fail");

  return {
    status: anyFailed ? "degraded" : "ok",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    region: process.env.VERCEL_REGION ?? "local",
    uptimeMs: Math.round(process.uptime() * 1000),
    durationMs: Date.now() - start,
    checks
  };
}
