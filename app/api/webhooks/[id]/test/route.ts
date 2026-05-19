import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { dispatch } from "@/lib/webhooks/dispatch";

export const runtime = "nodejs";

// Sends a synthetic certificate.issued event so customers can verify their
// signature checking and downstream wiring before relying on the real flow.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const db = getDb();

  if (!db || user.isDemo) {
    return NextResponse.json({
      ok: true,
      message: "Test event would be sent — webhooks require a database in production."
    });
  }

  const rows = await db
    .select()
    .from(schema.webhookEndpoints)
    .where(and(
      eq(schema.webhookEndpoints.id, params.id),
      eq(schema.webhookEndpoints.workspaceId, user.workspaceId)
    ))
    .limit(1);
  const endpoint = rows[0];
  if (!endpoint) return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });

  await dispatch({
    workspaceId: user.workspaceId,
    event: "certificate.issued",
    object: {
      id: `cert_test_${Date.now()}`,
      reference: "AFCFTA-TESTREF1",
      determination_id: "det_test",
      hs_code: "0901.11",
      origin_country: "KE",
      destination_country: "NG",
      test: true
    }
  });

  return NextResponse.json({ ok: true, message: "Test event dispatched. Check /dashboard/webhooks for delivery status." });
}
