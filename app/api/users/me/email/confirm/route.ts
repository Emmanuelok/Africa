import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { consumeToken } from "@/lib/auth/tokens";
import { audit } from "@/lib/server/audit";

export const runtime = "nodejs";

// GET: consumed from the email link. We use the identifier
// "email-change:OLD>NEW" so both old + new are known.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const fromRaw = url.searchParams.get("from") ?? "";
  const toRaw = url.searchParams.get("to") ?? "";
  const from = fromRaw.toLowerCase();
  const to = toRaw.toLowerCase();

  if (!token || !from || !to) {
    return NextResponse.redirect(new URL("/dashboard/settings?email=invalid", req.url));
  }

  const db = getDb();
  if (!db) return NextResponse.redirect(new URL("/dashboard/settings?email=unavailable", req.url));

  const identifier = `email-change:${from}>${to}`;
  const ok = await consumeToken("email-verify", identifier, token);
  if (!ok) {
    return NextResponse.redirect(new URL("/dashboard/settings?email=expired", req.url));
  }

  // Race-check on the new address — it might have been claimed in the meantime.
  const taken = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, to)).limit(1);
  if (taken.length > 0 && taken[0].id) {
    return NextResponse.redirect(new URL("/dashboard/settings?email=taken", req.url));
  }

  const result = await db
    .update(schema.users)
    .set({ email: to, emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.email, from))
    .returning({ id: schema.users.id });

  if (result.length === 0) {
    return NextResponse.redirect(new URL("/dashboard/settings?email=invalid", req.url));
  }

  audit({
    userId: result[0].id,
    action: "user.password_changed",
    actor: from,
    metadata: { event: "email_changed", from, to }
  });

  return NextResponse.redirect(new URL("/dashboard/settings?email=ok", req.url));
}
