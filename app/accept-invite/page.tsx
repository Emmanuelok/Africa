import Link from "next/link";
import { eq, and, isNull, gt } from "drizzle-orm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, ShieldX } from "lucide-react";
import { getDb, schema } from "@/lib/db/client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { audit } from "@/lib/server/audit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accept invitation — Sokoni" };

export default async function AcceptInvitePage({
  searchParams
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams?.token ?? "";
  if (!token) return <Invalid reason="missing token" />;

  const db = getDb();
  if (!db) return <Invalid reason="invitations are not enabled in this deployment" />;

  // Find the invitation, unrevoked, not yet accepted, not expired.
  const invitations = await db
    .select()
    .from(schema.workspaceInvitations)
    .where(and(
      eq(schema.workspaceInvitations.token, token),
      isNull(schema.workspaceInvitations.revokedAt),
      isNull(schema.workspaceInvitations.acceptedAt),
      gt(schema.workspaceInvitations.expiresAt, new Date())
    ))
    .limit(1);
  const invite = invitations[0];
  if (!invite) return <Invalid reason="invitation expired or already used" />;

  // Look up the workspace name for display.
  const wsRows = await db
    .select()
    .from(schema.workspaces)
    .where(eq(schema.workspaces.id, invite.workspaceId))
    .limit(1);
  const workspace = wsRows[0];
  if (!workspace) return <Invalid reason="workspace not found" />;

  // Already signed in? Auto-accept (workspace + user pairing).
  const session = await auth();
  if (session?.user?.email) {
    await acceptInvite({
      userEmail: session.user.email,
      invitationId: invite.id,
      workspaceId: invite.workspaceId,
      role: invite.role
    });
    redirect("/dashboard?accepted=1");
  }

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-xl px-4 py-16 md:px-6 md:py-24">
        <Badge tone="terracotta">Workspace invitation</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          Join <span className="text-terracotta-700">{workspace.name}</span> on Sokoni
        </h1>
        <p className="mt-3 text-ink-700">
          You&apos;ve been invited to <strong>{workspace.name}</strong> as{" "}
          <strong>{invite.role}</strong>. Sign in or create an account with{" "}
          <code className="rounded bg-ink-100 px-1 py-0.5 text-sm font-mono">{invite.email}</code>{" "}
          to accept.
        </p>

        <Card className="mt-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-savanna-600" />
            <div>
              <div className="font-semibold">What you get</div>
              <ul className="mt-1 space-y-1 text-sm text-ink-700">
                <li>· Access to all determinations and certificates in this workspace</li>
                <li>· Ability to generate new AfCFTA certificates and run the wizard</li>
                {invite.role === "admin" && (
                  <li>· Admin privileges: invite members, manage API keys, configure webhooks</li>
                )}
              </ul>
            </div>
          </div>
        </Card>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/register?email=${encodeURIComponent(invite.email)}&invite=${token}`}
            className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
          >
            Create an account
          </Link>
          <Link
            href={`/signin?from=${encodeURIComponent(`/accept-invite?token=${token}`)}`}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-4 py-2 text-sm font-medium hover:bg-ink-50"
          >
            Sign in instead
          </Link>
        </div>

        <p className="mt-6 text-xs text-ink-500">
          Expires {new Date(invite.expiresAt).toLocaleString()}. Wrong email or invitation? Ask the
          person who invited you to revoke this one and send a new invitation.
        </p>
      </div>
    </div>
  );
}

async function acceptInvite({
  userEmail,
  invitationId,
  workspaceId,
  role
}: {
  userEmail: string;
  invitationId: string;
  workspaceId: string;
  role: string;
}) {
  const db = getDb();
  if (!db) return;

  const userRows = await db.select().from(schema.users).where(eq(schema.users.email, userEmail)).limit(1);
  const user = userRows[0];
  if (!user) return;

  await db
    .insert(schema.workspaceMembers)
    .values({ workspaceId, userId: user.id, role })
    .onConflictDoNothing();

  await db
    .update(schema.workspaceInvitations)
    .set({ acceptedAt: new Date() })
    .where(eq(schema.workspaceInvitations.id, invitationId));

  audit({
    workspaceId,
    userId: user.id,
    action: "workspace.member_invited", // accepted; expand taxonomy later
    target: invitationId,
    metadata: { event: "accepted", role }
  });
}

function Invalid({ reason }: { reason: string }) {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-md px-4 py-16 text-center md:px-6 md:py-24">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-terracotta-50 text-terracotta-700">
          <ShieldX className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold">Invitation unavailable</h1>
        <p className="mt-2 text-ink-700">
          This invitation can&apos;t be used: {reason}. Ask the workspace owner to send a new one.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-terracotta-700 hover:underline">
          Back to sokoni.africa →
        </Link>
      </div>
    </div>
  );
}
