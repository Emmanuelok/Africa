// Cloudflare Turnstile — invisible CAPTCHA, free, drop-in.
// https://developers.cloudflare.com/turnstile/

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured() {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

// Returns true when:
//   - Turnstile is not configured (graceful pass-through for local/demo)
//   - OR the token verifies successfully with Cloudflare
export async function verifyTurnstile(token: string | null, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured — pass through

  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.warn("[turnstile] verify failed:", err);
    return false;
  }
}
