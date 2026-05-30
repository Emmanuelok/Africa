import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { verifyPassword } from "@/lib/auth/password";
import {
  generateTotpSecret,
  buildOtpAuthUrl,
  verifyTotpToken,
  generateRecoveryCodes,
  hashRecoveryCode
} from "@/lib/auth/totp";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

const StartBody = z.object({ password: z.string().min(1) });
const ConfirmBody = z.object({
  secret: z.string().min(16).max(64),
  token: z.string().regex(/^\d{6}$/)
});

// Step 1: POST without `secret` → returns a fresh secret + otpauth URL + QR.
// Step 2: POST with `secret` and a valid token → enables TOTP and returns
// one-time recovery codes.
export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "checkout");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });

  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json({ error: "Demo accounts can't enable 2FA. Register a real account first." }, { status: 403, headers });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503, headers });

  const json = await req.json().catch(() => ({}));

  // STEP 2 — confirm enrollment
  if (json && typeof json.secret === "string" && typeof json.token === "string") {
    const parsed = ConfirmBody.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400, headers });
    const ok = verifyTotpToken(parsed.data.token, parsed.data.secret);
    if (!ok) return NextResponse.json({ error: "Incorrect code. Try again — the codes rotate every 30s." }, { status: 400, headers });

    const codes = generateRecoveryCodes();
    const hashed = codes.map(hashRecoveryCode);
    await db
      .update(schema.users)
      .set({ totpSecret: parsed.data.secret, totpEnabled: true, totpRecoveryCodes: hashed, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));

    const { ipAddress, userAgent } = ipAndUaFromRequest(req);
    audit({ userId: user.id, action: "user.password_changed", actor: user.email, metadata: { event: "totp_enabled" }, ipAddress, userAgent });

    return NextResponse.json({ ok: true, recoveryCodes: codes }, { headers });
  }

  // STEP 1 — issue secret, require password re-auth before showing it
  const parsed = StartBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Password required" }, { status: 400, headers });

  const rows = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  const u = rows[0];
  if (!u?.passwordHash) return NextResponse.json({ error: "Set a password before enabling 2FA" }, { status: 400, headers });
  const passOk = await verifyPassword(parsed.data.password, u.passwordHash);
  if (!passOk) return NextResponse.json({ error: "Incorrect password" }, { status: 401, headers });

  const secret = generateTotpSecret();
  const otpauth = buildOtpAuthUrl(user.email, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth, { errorCorrectionLevel: "M", margin: 1, width: 240 });

  // We deliberately do NOT persist the secret until the user proves they can
  // generate a valid token from it (step 2).
  return NextResponse.json({ secret, otpauth, qrDataUrl }, { headers });
}
