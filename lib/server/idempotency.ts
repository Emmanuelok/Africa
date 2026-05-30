import { createHash } from "crypto";
import { cacheGet, cacheSet } from "@/lib/cache";

// 24h idempotency window. When a client sends the same Idempotency-Key
// twice (within the window, scoped to the caller workspace/key), the second
// call returns the cached response instead of re-running the side effects.
const TTL_SECONDS = 24 * 60 * 60;

function key(scope: string, idempotencyKey: string): string {
  // Hash to keep the cache key compact and to handle long inputs.
  const h = createHash("sha256").update(`${scope}:${idempotencyKey}`).digest("hex").slice(0, 32);
  return `idem:${h}`;
}

export type StoredResponse = { status: number; body: unknown };

export async function getIdempotent(scope: string, idempotencyKey: string): Promise<StoredResponse | null> {
  return cacheGet<StoredResponse>(key(scope, idempotencyKey));
}

export async function rememberIdempotent(
  scope: string,
  idempotencyKey: string,
  response: StoredResponse
): Promise<void> {
  await cacheSet(key(scope, idempotencyKey), response, TTL_SECONDS);
}

// Extract Idempotency-Key from a request; trims, caps length to 255.
export function readIdempotencyKey(req: Request): string | null {
  const raw = req.headers.get("idempotency-key");
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 255) return null;
  return trimmed;
}
