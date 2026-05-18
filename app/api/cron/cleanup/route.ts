import { NextResponse } from "next/server";
import { lt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

// Hit daily by Vercel Cron (see vercel.json). Vercel sets the
// `Authorization: Bearer $CRON_SECRET` header automatically when the env var
// is configured; reject anything else so this endpoint isn't world-callable.
function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // require it explicitly in prod
  const got = req.headers.get("authorization");
  return got === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const summary: Record<string, number | string> = { ranAt: new Date().toISOString() };

  if (!db) {
    summary.skipped = "no database configured";
    return NextResponse.json(summary);
  }

  try {
    // 1. Prune expired sessions
    const purgedSessions = await db
      .delete(schema.sessions)
      .where(lt(schema.sessions.expires, new Date()))
      .returning({ id: schema.sessions.sessionToken });
    summary.purgedSessions = purgedSessions.length;

    // 2. Prune expired verification tokens
    const purgedTokens = await db
      .delete(schema.verificationTokens)
      .where(lt(schema.verificationTokens.expires, new Date()))
      .returning({ token: schema.verificationTokens.token });
    summary.purgedVerificationTokens = purgedTokens.length;

    // 3. (Future) Stripe webhook reconciliation, certificate-expiry reminders,
    //    rate-limit metrics rollup, etc.
  } catch (err) {
    console.error("[cron:cleanup]", err);
    summary.error = String((err as Error).message ?? err);
    return NextResponse.json(summary, { status: 500 });
  }

  console.log("[cron:cleanup]", summary);
  return NextResponse.json(summary);
}
