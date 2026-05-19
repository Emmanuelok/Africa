import { NextResponse } from "next/server";
import { and, eq, isNull, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  const db = getDb();
  if (!db || user.isDemo) return NextResponse.json({ ok: true, isDemo: true });

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string") : null;
  const all = Boolean(body?.all);

  if (all) {
    await db
      .update(schema.notifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(schema.notifications.workspaceId, user.workspaceId),
        isNull(schema.notifications.readAt)
      ));
  } else if (ids && ids.length > 0) {
    await db
      .update(schema.notifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(schema.notifications.workspaceId, user.workspaceId),
        inArray(schema.notifications.id, ids)
      ));
  } else {
    return NextResponse.json({ error: "Provide ids or all:true" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
