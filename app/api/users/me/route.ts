import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { verifyPassword } from "@/lib/auth/password";
import { verifyTotpToken, consumeRecoveryCode } from "@/lib/auth/totp";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { getStripe } from "@/lib/billing/stripe";
import { deleteCertificatePdf } from "@/lib/blob/store";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/server/workspace";

export const runtime = "nodejs";

const Body = z.object({
  password: z.string().min(1),
  totp: z.string().optional(),
  confirm: z.string()
});

// DELETE /api/users/me — GDPR right to erasure.
// Re-authenticates with password (and TOTP if enabled), refuses if the
// user is the sole owner of a workspace with other members (must transfer
// or delete the workspace first). Cascade-deletes the user; orphan workspaces
// where the user was sole owner are dropped along with their sub-rows.
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json({ error: "Demo accounts can't be deleted." }, { status: 403 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (parsed.data.confirm !== "DELETE") {
    return NextResponse.json({ error: 'Type "DELETE" to confirm.' }, { status: 400 });
  }

  // Re-auth
  const rows = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  const u = rows[0];
  if (!u?.passwordHash) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (!(await verifyPassword(parsed.data.password, u.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  if (u.totpEnabled) {
    const tok = String(parsed.data.totp ?? "");
    if (!tok) return NextResponse.json({ error: "2FA code required", code: "2fa_required" }, { status: 401 });
    const totpOk = u.totpSecret ? verifyTotpToken(tok, u.totpSecret) : false;
    if (!totpOk) {
      const remaining = u.totpRecoveryCodes ? consumeRecoveryCode(tok, u.totpRecoveryCodes) : null;
      if (!remaining) return NextResponse.json({ error: "Code did not verify" }, { status: 401 });
    }
  }

  // Find workspaces where this user is the only owner. If any such workspace
  // has *other* members, refuse — they'd be locked out. Otherwise we delete
  // them (cascades clean up the rest).
  const ownerships = await db
    .select({ workspaceId: schema.workspaceMembers.workspaceId })
    .from(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.userId, user.id), eq(schema.workspaceMembers.role, "owner")));

  const blockingWorkspaces: { id: string; memberCount: number }[] = [];
  const workspacesToDelete: string[] = [];
  for (const o of ownerships) {
    const otherOwners = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.workspaceMembers)
      .where(and(
        eq(schema.workspaceMembers.workspaceId, o.workspaceId),
        eq(schema.workspaceMembers.role, "owner"),
        sql`${schema.workspaceMembers.userId} <> ${user.id}`
      ));
    if ((otherOwners[0]?.c ?? 0) > 0) continue; // somebody else can take over

    const totalMembers = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.workspaceId, o.workspaceId));
    const memberCount = totalMembers[0]?.c ?? 1;
    if (memberCount > 1) {
      blockingWorkspaces.push({ id: o.workspaceId, memberCount });
    } else {
      workspacesToDelete.push(o.workspaceId);
    }
  }

  if (blockingWorkspaces.length > 0) {
    return NextResponse.json(
      {
        error: "You're the only owner of workspaces that have other members. Transfer ownership or delete those workspaces first.",
        blockingWorkspaces
      },
      { status: 409 }
    );
  }

  const stripe = getStripe();
  for (const wsId of workspacesToDelete) {
    // Cancel Stripe sub for the workspace.
    const wsRows = await db.select().from(schema.workspaces).where(eq(schema.workspaces.id, wsId)).limit(1);
    const ws = wsRows[0];
    if (ws?.stripeSubscriptionId && stripe) {
      try { await stripe.subscriptions.cancel(ws.stripeSubscriptionId); } catch {}
    }
    // Drop certificate PDFs from Blob.
    const certs = await db
      .select({ reference: schema.certificates.reference })
      .from(schema.certificates)
      .where(eq(schema.certificates.workspaceId, wsId));
    await Promise.all(certs.map((c) => deleteCertificatePdf(c.reference).catch(() => {})));
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, wsId));
  }

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    userId: user.id,
    action: "user.password_changed", // taxonomy doesn't have user.deleted yet
    actor: user.email,
    metadata: { event: "account_deleted", workspacesDeleted: workspacesToDelete.length },
    ipAddress,
    userAgent
  });

  await db.delete(schema.users).where(eq(schema.users.id, user.id));

  // Clear cookies — workspace + active session.
  cookies().delete(ACTIVE_WORKSPACE_COOKIE);
  for (const n of ["authjs.session-token", "__Secure-authjs.session-token"]) {
    cookies().delete(n);
  }

  return NextResponse.json({ ok: true });
}
