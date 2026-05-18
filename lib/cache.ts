import { Redis } from "@upstash/redis";

// Cheap key/value cache using the same Upstash Redis instance we use for
// rate limiting. Falls back to a per-process in-memory map when Upstash isn't
// configured — fine for local dev and demo, useless across serverless cold
// starts (which is the right trade-off: no cache is better than wrong cache).

let redis: Redis | null = null;
let attempted = false;
const mem = new Map<string, { value: unknown; expiresAt: number }>();

function getRedis(): Redis | null {
  if (attempted) return redis;
  attempted = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const PREFIX = "sokoni:cache:";

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) {
    const hit = mem.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      mem.delete(key);
      return null;
    }
    return hit.value as T;
  }
  try {
    return (await r.get(`${PREFIX}${key}`)) as T | null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) {
    mem.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    return;
  }
  try {
    await r.set(`${PREFIX}${key}`, value as unknown, { ex: ttlSeconds });
  } catch {}
}

// Convenience: get-or-compute. The compute is called once on miss; result is
// cached for `ttlSeconds`.
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null && hit !== undefined) return hit;
  const value = await compute();
  await cacheSet(key, value, ttlSeconds);
  return value;
}
