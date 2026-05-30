import { generateSecret, verifySync, generateURI } from "otplib";
import { createHash, randomBytes } from "crypto";

export const ISSUER = "Sokoni";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function buildOtpAuthUrl(email: string, secret: string): string {
  return generateURI({
    strategy: "totp",
    issuer: ISSUER,
    label: email,
    secret,
    algorithm: "sha1",
    digits: 6,
    period: 30
  });
}

export function verifyTotpToken(token: string, secret: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  try {
    const r = verifySync({ token, secret });
    if (!r?.valid) return false;
    // Accept current step and ±1 step (60s of clock skew).
    return Math.abs(r.delta ?? 0) <= 1;
  } catch {
    return false;
  }
}

// Recovery codes — XXXXX-XXXXX format. Shown once at enrollment;
// stored hashed so a DB leak doesn't expose them.
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(5).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(code.replace(/-/g, "").toLowerCase()).digest("hex");
}

// Returns the remaining codes (with the consumed one removed) or null if no match.
export function consumeRecoveryCode(input: string, hashedCodes: string[]): string[] | null {
  const target = hashRecoveryCode(input);
  const idx = hashedCodes.findIndex((c) => c === target);
  if (idx === -1) return null;
  return hashedCodes.filter((_, i) => i !== idx);
}
