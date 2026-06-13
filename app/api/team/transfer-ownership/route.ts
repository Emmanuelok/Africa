import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { verifyPassword } from "@/lib/auth/password";
import { verifyTotpToken, consumeRecoveryCode } from "@/lib/auth/totp";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { notify } from "@/lib/server/notify";
import { logFor } from "@/lib/log";

export const runtime = "nodejs";

const Body = z.object({
  newOwnerUserId: z.string().min(1),
  password: z.string().min(1),
  totp: z.string().optional(),
  demoteSelfTo: z.enum(["admin", "member"]).default("admin")
});

// POST /api/team/transfer-ownership — hand the owner role to another member.
// Re-authenticated (password + TOTP). The current owner is demoted to admin
// (or member). Atomic: both role updates happen before responding.
export async function POST(req: Request) {
  const logger = logFor(req, { route: "/api/team/transfer-ownership" });
  const user = await getSessionUser();
  if (user.isDemo) return NextResponse.json({ ok: true, isDemo: true });
  if (user.role !== "owner") {
    return NextResponse.json({ error: "Only an owner can transfer ownership." }, { status: 403 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (parsed.data.newOwnerUserId === user.id) {
    return NextResponse.json({ error: "You're already the owner." }, { status: 400 });
  }

  // Re-auth.
  const meRows = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  const me = meRows[0];
  if (!me?.passwordHash) return NextResponse.json({ error: "Account missing a password" }, { status: 400 });
  if (!(await verifyPassword(parsed.data.password, me.passwordHash))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  if (me.totpEnabled) {
    const tok = String(parsed.data.totp ?? "");
    if (!tok) return NextResponse.json({ error: "2FA code required", code: "2fa_required" }, { status: 401 });
    const totpOk = me.totpSecret ? verifyTotpToken(tok, me.totpSecret) : false;
    if (!totpOk) {
      const remaining = me.totpRecoveryCodes ? consumeRecoveryCode(tok, me.totpRecoveryCodes) : null;
      if (!remaining) return NextResponse.json({ error: "Code did not verify" }, { status: 401 });
      await db.update(schema.users).set({ totpRecoveryCodes: remaining, updatedAt: new Date() }).where(eq(schema.users.id, user.id));
    }
  }

  // Confirm the target is a member of this workspace.
  const target = await db
    .select()
    .from(schema.workspaceMembers)
    .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.userId, parsed.data.newOwnerUserId)))
    .limit(1);
  if (target.length === 0) return NextResponse.json({ error: "That member isn't in this workspace." }, { status: 404 });

  // Promote target, demote self.
  await db
    .update(schema.workspaceMembers)
    .set({ role: "owner" })
    .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.userId, parsed.data.newOwnerUserId)));
  await db
    .update(schema.workspaceMembers)
    .set({ role: parsed.data.demoteSelfTo })
    .where(and(eq(schema.workspaceMembers.workspaceId, user.workspaceId), eq(schema.workspaceMembers.userId, user.id)));

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "workspace.member_invited",
    target: parsed.data.newOwnerUserId,
    metadata: { event: "ownership_transferred", from: user.id, demotedTo: parsed.data.demoteSelfTo },
    ipAddress,
    userAgent
  });
  notify({
    workspaceId: user.workspaceId,
    userId: parsed.data.newOwnerUserId,
    kind: "system.update",
    title: "You're now the workspace owner",
    body: `${user.name ?? user.email} transferred ownership of ${user.workspaceName} to you.`,
    target: "/dashboard/team"
  });
  logger.info({ workspaceId: user.workspaceId, newOwner: parsed.data.newOwnerUserId }, "ownership transferred");

  return NextResponse.json({ ok: true });
}
