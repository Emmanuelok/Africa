import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, and, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { generateApiKey } from "@/lib/api/keys";
import { DEMO_API_KEYS } from "@/lib/data/demo-store";
import { API_SCOPES } from "@/lib/api/v1-auth";
import { checkQuota } from "@/lib/server/quota";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

const ScopeEnum = z.enum(["*", ...API_SCOPES]);
const Body = z.object({
  name: z.string().min(1).max(80),
  env: z.enum(["live", "test"]).default("live"),
  scopes: z.array(ScopeEnum).min(1).default(["*"])
});

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const q = await checkQuota(user.workspaceId, user.plan, "apiKeysMax");
    if (!q.ok) {
      return NextResponse.json({ error: q.reason, used: q.used, limit: q.limit, code: "quota_exceeded" }, { status: 402 });
    }

    const generated = generateApiKey(parsed.data.env);
    const db = getDb();

    let id: string | null = null;
    if (db && !user.isDemo) {
      const inserted = await db
        .insert(schema.apiKeys)
        .values({
          workspaceId: user.workspaceId,
          name: parsed.data.name,
          hashedKey: generated.hash,
          prefix: generated.prefix,
          scopes: parsed.data.scopes
        })
        .returning({ id: schema.apiKeys.id });
      id = inserted[0]?.id ?? null;

      const { ipAddress, userAgent } = ipAndUaFromRequest(req);
      audit({
        workspaceId: user.workspaceId,
        userId: user.id,
        action: "api_key.created",
        target: id,
        metadata: { name: parsed.data.name, env: parsed.data.env, scopes: parsed.data.scopes },
        ipAddress,
        userAgent
      });
    }

    return NextResponse.json({
      ok: true,
      id,
      plaintext: generated.plaintext,
      prefix: generated.prefix,
      suffix: generated.suffix,
      name: parsed.data.name,
      scopes: parsed.data.scopes,
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
    return NextResponse.json({ keys: DEMO_API_KEYS.map((k) => ({ ...k, scopes: ["*"] })) });
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
      scopes: (r.scopes as string[]) ?? ["*"],
      lastUsedAt: r.lastUsedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString()
    }))
  });
}
