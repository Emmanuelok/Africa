import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { consumeToken } from "@/lib/auth/tokens";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().email(),
  token: z.string().min(20).max(80),
  password: z.string().min(12).max(256)
});

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "waitlist");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400, headers });
  }
  const { email, token, password } = parsed.data;

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Reset unavailable" }, { status: 503, headers });

  const ok = await consumeToken("password-reset", email.toLowerCase(), token);
  if (!ok) {
    return NextResponse.json({ error: "Link is invalid or expired. Request a new one." }, { status: 400, headers });
  }

  const passwordHash = await hashPassword(password);
  const result = await db
    .update(schema.users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(schema.users.email, email.toLowerCase()))
    .returning({ id: schema.users.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Account not found" }, { status: 404, headers });
  }

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    userId: result[0].id,
    action: "user.password_changed",
    actor: email.toLowerCase(),
    metadata: { method: "reset" },
    ipAddress,
    userAgent
  });

  return NextResponse.json({ ok: true }, { headers });
}
