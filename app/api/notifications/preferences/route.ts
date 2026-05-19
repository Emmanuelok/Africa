import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { NOTIFICATION_KINDS, type NotificationKind } from "@/lib/notifications/kinds";

export const runtime = "nodejs";

const VALID_KINDS = new Set(NOTIFICATION_KINDS.map((k) => k.kind));

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();

  // Build a full prefs map from defaults, then overlay DB rows if available.
  const prefs: Record<string, { inProduct: boolean; email: boolean }> = {};
  for (const k of NOTIFICATION_KINDS) {
    prefs[k.kind] = { inProduct: k.defaultInProduct, email: k.defaultEmail };
  }

  if (db && !user.isDemo) {
    const rows = await db
      .select()
      .from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, user.id));
    for (const r of rows) {
      prefs[r.kind] = { inProduct: r.inProduct, email: r.email };
    }
  }

  return NextResponse.json({ preferences: prefs });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) {
    return NextResponse.json({ ok: true, isDemo: true });
  }

  const body = await req.json();
  const updates = body?.preferences as Record<string, { inProduct: boolean; email: boolean }> | undefined;
  if (!updates || typeof updates !== "object") {
    return NextResponse.json({ error: "preferences object required" }, { status: 400 });
  }

  for (const [kind, value] of Object.entries(updates)) {
    if (!VALID_KINDS.has(kind as NotificationKind)) continue;
    const inProduct = Boolean(value?.inProduct);
    const email = Boolean(value?.email);
    await db
      .insert(schema.notificationPreferences)
      .values({ userId: user.id, kind, inProduct, email, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [schema.notificationPreferences.userId, schema.notificationPreferences.kind],
        set: { inProduct, email, updatedAt: new Date() }
      });
  }

  return NextResponse.json({ ok: true });
}
