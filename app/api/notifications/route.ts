import { NextResponse } from "next/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

const DEMO_NOTIFICATIONS = [
  {
    id: "n_demo_1",
    kind: "certificate.issued",
    title: "Certificate AFCFTA-K9P4XJ02 issued",
    body: "Coffee shipment KE → NG · $930 in AfCFTA savings",
    target: "/dashboard/certificates",
    readAt: null,
    createdAt: "2026-05-17T14:25:00Z"
  },
  {
    id: "n_demo_2",
    kind: "determination.marginal",
    title: "Marginal: cotton wax-print fabric",
    body: "RVC at 35% — consider sourcing more from AfCFTA. Lane CI → GH.",
    target: "/dashboard/determinations",
    readAt: null,
    createdAt: "2026-05-12T11:48:00Z"
  },
  {
    id: "n_demo_3",
    kind: "system.update",
    title: "Ghana 2026 tariff schedule published",
    body: "We've added the new HS rates. Re-classify shipments to benefit.",
    target: "/changelog",
    readAt: "2026-05-10T09:00:00Z",
    createdAt: "2026-05-10T07:14:00Z"
  }
];

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();

  if (!db || user.isDemo) {
    return NextResponse.json({
      notifications: DEMO_NOTIFICATIONS,
      unreadCount: DEMO_NOTIFICATIONS.filter((n) => !n.readAt).length
    });
  }

  const rows = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.workspaceId, user.workspaceId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(50);

  const unreadRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.notifications)
    .where(and(
      eq(schema.notifications.workspaceId, user.workspaceId),
      isNull(schema.notifications.readAt)
    ));

  return NextResponse.json({
    notifications: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      body: r.body,
      target: r.target,
      readAt: r.readAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString()
    })),
    unreadCount: unreadRows[0]?.c ?? 0
  });
}
