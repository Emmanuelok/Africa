import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { verifyPassword } from "@/lib/auth/password";
import { generateRecoveryCodes, hashRecoveryCode } from "@/lib/auth/totp";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

const Body = z.object({ password: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (user.isDemo) return NextResponse.json({ error: "Demo accounts can't manage 2FA." }, { status: 403 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Password required" }, { status: 400 });

  const rows = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  const u = rows[0];
  if (!u?.passwordHash || !u.totpEnabled) {
    return NextResponse.json({ error: "2FA must be enabled first" }, { status: 400 });
  }
  if (!(await verifyPassword(parsed.data.password, u.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const codes = generateRecoveryCodes();
  await db
    .update(schema.users)
    .set({ totpRecoveryCodes: codes.map(hashRecoveryCode), updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({ userId: user.id, action: "user.password_changed", actor: user.email, metadata: { event: "totp_recovery_regenerated" }, ipAddress, userAgent });

  return NextResponse.json({ ok: true, recoveryCodes: codes });
}
