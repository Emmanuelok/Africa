import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/server/workspace";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { getStripe } from "@/lib/billing/stripe";
import { deleteCertificatePdf } from "@/lib/blob/store";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json(
      { error: "Workspace deletion requires a real account." },
      { status: 403 }
    );
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  // Only the owner can delete.
  const memberships = await db
    .select()
    .from(schema.workspaceMembers)
    .where(and(
      eq(schema.workspaceMembers.workspaceId, params.id),
      eq(schema.workspaceMembers.userId, user.id),
      eq(schema.workspaceMembers.role, "owner")
    ))
    .limit(1);
  if (memberships.length === 0) {
    return NextResponse.json({ error: "Only the workspace owner can delete it." }, { status: 403 });
  }

  // Confirm via the supplied name match — prevents fat-finger deletes.
  let body: { confirm?: string } = {};
  try { body = await req.json(); } catch {}
  const wsRows = await db
    .select()
    .from(schema.workspaces)
    .where(eq(schema.workspaces.id, params.id))
    .limit(1);
  const ws = wsRows[0];
  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  if (body?.confirm !== ws.name) {
    return NextResponse.json(
      { error: `Type "${ws.name}" exactly to confirm deletion.` },
      { status: 400 }
    );
  }

  // Cancel Stripe subscription if any.
  if (ws.stripeSubscriptionId) {
    const stripe = getStripe();
    if (stripe) {
      try {
        await stripe.subscriptions.cancel(ws.stripeSubscriptionId);
      } catch (err) {
        console.warn("[workspace:delete] stripe cancel failed:", err);
      }
    }
  }

  // Best-effort Blob cleanup. Cascades cover the rest of the DB.
  const certs = await db
    .select({ reference: schema.certificates.reference })
    .from(schema.certificates)
    .where(eq(schema.certificates.workspaceId, params.id));
  await Promise.all(certs.map((c) => deleteCertificatePdf(c.reference).catch(() => {})));

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: params.id,
    userId: user.id,
    action: "workspace.member_removed",
    target: params.id,
    metadata: { event: "workspace_deleted", name: ws.name },
    ipAddress,
    userAgent
  });

  // Foreign keys cascade members, determinations, certificates, api_keys,
  // api_usage, webhook_endpoints, webhook_deliveries, audit_log, notifications,
  // workspace_invitations.
  await db.delete(schema.workspaces).where(eq(schema.workspaces.id, params.id));

  // Clear cookie if it pointed to this workspace.
  const active = cookies().get(ACTIVE_WORKSPACE_COOKIE)?.value;
  if (active === params.id) {
    cookies().delete(ACTIVE_WORKSPACE_COOKIE);
  }

  return NextResponse.json({ ok: true });
}
