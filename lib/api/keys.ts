import { randomBytes, createHash, timingSafeEqual } from "crypto";

// Sokoni API key format: sk_(live|test)_<24 base64url chars>
// We never store the plaintext — only a SHA-256 hash + the 4-char suffix
// for display. SHA-256 is fine here because keys are high-entropy (144 bits).

export type Env = "live" | "test";

export function generateApiKey(env: Env = "live"): { plaintext: string; prefix: string; suffix: string; hash: string } {
  const raw = randomBytes(18).toString("base64url"); // 24 chars
  const prefix = `sk_${env}_`;
  const plaintext = `${prefix}${raw}`;
  const suffix = raw.slice(-4);
  const hash = sha256(plaintext);
  return { plaintext, prefix, suffix, hash };
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function maskKey(prefix: string, suffix: string): string {
  return `${prefix}••••••••••••${suffix}`;
}

// Constant-time hash comparison. Throws on length mismatch which protects
// against timing oracles on key length.
export function safeHashEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

// Pull `Authorization: Bearer sk_...` out of a request.
export function extractKey(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const match = h.match(/^Bearer\s+(sk_(?:live|test)_[A-Za-z0-9_-]+)$/);
  return match?.[1] ?? null;
}
