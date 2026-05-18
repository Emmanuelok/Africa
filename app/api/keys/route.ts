import { NextResponse } from "next/server";
import { desc, and, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { generateApiKey } from "@/lib/api/keys";
import { DEMO_API_KEYS } from "@/lib/data/demo-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const name = String(body?.name ?? "").trim().slice(0, 80);
    const env = (body?.env === "test" ? "test" : "live") as "live" | "test";
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const generated = generateApiKey(env);
    const db = getDb();

    if (db && !user.isDemo) {
      await db.insert(schema.apiKeys).values({
        workspaceId: user.workspaceId,
        name,
        hashedKey: generated.hash,
        prefix: generated.prefix
      });
    }

    // Plaintext is shown ONLY in this response. Never stored.
    return NextResponse.json({
      ok: true,
      plaintext: generated.plaintext,
      prefix: generated.prefix,
      suffix: generated.suffix,
      name,
      isDemo: user.isDemo
    });
  } catch (err) {
    console.error("[/api/keys POST]", err);
    return NextResponse.json({ error: "Could not create key" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();

  if (!db || user.isDemo) {
    return NextResponse.json({ keys: DEMO_API_KEYS });
  }

  const rows = await db
    .select()
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.workspaceId, user.workspaceId), isNull(schema.apiKeys.revokedAt)))
    .orderBy(desc(schema.apiKeys.createdAt));

  return NextResponse.json({
    keys: rows.map((r) => ({
      id: r.id,
      name: r.name,
      prefix: r.prefix,
      maskedKey: `${r.prefix}••••••••••••${r.hashedKey.slice(-4)}`,
      lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString()
    }))
  });
}
