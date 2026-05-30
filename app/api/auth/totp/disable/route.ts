import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { verifyPassword } from "@/lib/auth/password";
import { verifyTotpToken, consumeRecoveryCode } from "@/lib/auth/totp";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

const Body = z.object({
  password: z.string().min(1),
  // Either a current TOTP code OR a recovery code is acceptable as proof
  // of possession.
  token: z.string().min(6).max(16)
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (user.isDemo) return NextResponse.json({ error: "Demo accounts can't manage 2FA." }, { status: 403 });

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const rows = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  const u = rows[0];
  if (!u?.passwordHash) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (!u.totpEnabled) return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });

  const passOk = await verifyPassword(parsed.data.password, u.passwordHash);
  if (!passOk) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });

  const totpOk = u.totpSecret ? verifyTotpToken(parsed.data.token, u.totpSecret) : false;
  let codesAfter: string[] | null = null;
  if (!totpOk && u.totpRecoveryCodes) {
    codesAfter = consumeRecoveryCode(parsed.data.token, u.totpRecoveryCodes);
  }
  if (!totpOk && !codesAfter) {
    return NextResponse.json({ error: "Code did not verify" }, { status: 401 });
  }

  await db
    .update(schema.users)
    .set({ totpSecret: null, totpEnabled: false, totpRecoveryCodes: null, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({ userId: user.id, action: "user.password_changed", actor: user.email, metadata: { event: "totp_disabled" }, ipAddress, userAgent });

  return NextResponse.json({ ok: true });
}
