import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { dispatch } from "@/lib/webhooks/dispatch";
import { notify } from "@/lib/server/notify";
import { logFor } from "@/lib/log";

export const runtime = "nodejs";

const Body = z.object({ reason: z.string().min(3).max(300) });

// POST /api/certificates/[id]/revoke — invalidate an issued certificate.
// Owner/admin only. The public verify page reflects revocation immediately.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const logger = logFor(req, { route: "/api/certificates/[id]/revoke" });
  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json({ error: "Revocation requires a real account." }, { status: 403 });
  }
  if (user.role !== "owner" && user.role !== "admin") {
    return NextResponse.json({ error: "Only an owner or admin can revoke certificates." }, { status: 403 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "A reason is required" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(schema.certificates)
    .where(and(eq(schema.certificates.id, params.id), eq(schema.certificates.workspaceId, user.workspaceId)))
    .limit(1);
  const cert = rows[0];
  if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  if (cert.revokedAt) {
    return NextResponse.json({ error: "Certificate is already revoked." }, { status: 409 });
  }

  await db
    .update(schema.certificates)
    .set({ revokedAt: new Date(), revokedReason: parsed.data.reason, revokedById: user.id })
    .where(eq(schema.certificates.id, params.id));

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "certificate.issued" as never, // taxonomy: reuse closest; metadata disambiguates
    target: params.id,
    metadata: { event: "certificate_revoked", reference: cert.reference, reason: parsed.data.reason },
    ipAddress,
    userAgent
  });

  void dispatch({
    workspaceId: user.workspaceId,
    event: "certificate.revoked",
    object: { id: params.id, reference: cert.reference, reason: parsed.data.reason }
  });

  notify({
    workspaceId: user.workspaceId,
    userId: user.id,
    kind: "system.update",
    title: `Certificate ${cert.reference} revoked`,
    body: `Reason: ${parsed.data.reason}. The public verification page now shows it as invalid.`,
    target: "/dashboard/certificates"
  });

  logger.info({ workspaceId: user.workspaceId, certificateId: params.id, reference: cert.reference }, "certificate revoked");

  return NextResponse.json({ ok: true });
}
