import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/Badge";
import { KybForm } from "@/components/dashboard/KybForm";
import { getSessionUser } from "@/lib/server/session";
import { getDb, schema } from "@/lib/db/client";

export const metadata = { title: "Business verification — Sokoni" };

export default async function VerificationPage() {
  const user = await getSessionUser();
  const db = getDb();

  let status: "not_started" | "pending" | "verified" | "rejected" = "not_started";
  let rejectionReason: string | null = null;
  let verifiedAt: string | null = null;

  if (db && !user.isDemo) {
    const rows = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, user.workspaceId))
      .limit(1);
    const ws = rows[0];
    if (ws) {
      status = (ws.kybStatus as typeof status) ?? "not_started";
      rejectionReason = ws.kybRejectionReason ?? null;
      verifiedAt = ws.kybVerifiedAt?.toISOString() ?? null;
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold md:text-3xl">Business verification</h1>
          <Badge tone="info">KYB</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-600">
          Verify your registered business via Smile Identity. Required for Approved Exporter status
          and unlocks higher Certificate quotas on paid plans.
        </p>
      </header>

      <KybForm
        initialStatus={status}
        rejectionReason={rejectionReason}
        verifiedAt={verifiedAt}
      />
    </div>
  );
}
