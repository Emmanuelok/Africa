import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy Upstash client. Without credentials we hand back a permissive
// no-op limiter so local/demo development isn't blocked.

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms
};

const NOOP: LimitResult = { success: true, limit: 1000, remaining: 1000, reset: Date.now() + 60_000 };

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  const r = getRedis();
  if (!r) return null;
  const key = `${name}:${requests}:${window}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(requests, window),
        analytics: true,
        prefix: `sokoni:rl:${name}`
      })
    );
  }
  return limiters.get(key)!;
}

// Public preset limiters. Tune per route.
export async function rateLimit(
  identifier: string,
  preset: "classify" | "checkout" | "waitlist" | "api"
): Promise<LimitResult> {
  const cfg = PRESETS[preset];
  const limiter = getLimiter(preset, cfg.requests, cfg.window);
  if (!limiter) return NOOP;
  const r = await limiter.limit(identifier);
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

const PRESETS: Record<string, { requests: number; window: `${number} ${"s" | "m" | "h" | "d"}` }> = {
  classify: { requests: 20, window: "1 m" }, // 20/min — protects Anthropic spend
  checkout: { requests: 5, window: "1 m" },
  waitlist: { requests: 3, window: "10 m" }, // 3 per 10 min per IP
  api: { requests: 60, window: "1 m" }
};

// Pull a useful identifier from a Request. Falls back to a constant so the
// limiter still works (per-route global limit) when there's no proxy header.
export function clientIdentifier(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const real = req.headers.get("x-real-ip");
  const ip = fwd?.split(",")[0]?.trim() || real || "anon";
  return ip;
}

export function rateLimitResponseHeaders(r: LimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(r.limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.floor(r.reset / 1000))
  };
}
