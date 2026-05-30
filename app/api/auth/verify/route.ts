import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { consumeToken } from "@/lib/auth/tokens";

export const runtime = "nodejs";

// Email verification is a GET so it works straight from the email link.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") ?? "").toLowerCase();
  const token = url.searchParams.get("token") ?? "";

  if (!email || !token) {
    return NextResponse.redirect(new URL("/verify-email?status=invalid", req.url));
  }

  const db = getDb();
  if (!db) return NextResponse.redirect(new URL("/verify-email?status=unavailable", req.url));

  const ok = await consumeToken("email-verify", email, token);
  if (!ok) {
    return NextResponse.redirect(new URL("/verify-email?status=expired", req.url));
  }

  await db
    .update(schema.users)
    .set({ emailVerified: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.email, email));

  return NextResponse.redirect(new URL("/verify-email?status=ok", req.url));
}
