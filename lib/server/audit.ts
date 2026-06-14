import { getDb, schema } from "@/lib/db/client";
import { log } from "@/lib/log";

export type AuditAction =
  | "determination.created"
  | "certificate.issued"
  | "certificate.endorsed"
  | "webhook.endpoint.created"
  | "webhook.endpoint.revoked"
  | "webhook.endpoint.updated"
  | "api_key.created"
  | "api_key.revoked"
  | "user.signed_in"
  | "user.registered"
  | "user.password_changed"
  | "workspace.member_invited"
  | "workspace.member_removed"
  | "billing.subscribed"
  | "billing.canceled"
  | "bulk.classified"
  | "agent.created"
  | "agent.updated"
  | "agent.deleted"
  | "agent.run_started"
  | "agent.approval_resolved";

export type AuditInput = {
  workspaceId?: string | null;
  userId?: string | null;
  actor?: string | null; // human-readable (e.g. "system", "api:production-erp")
  action: AuditAction;
  target?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

// Fire-and-forget audit log. Never throws.
export function audit(input: AuditInput): void {
  const db = getDb();
  if (!db) return;
  void db
    .insert(schema.auditLog)
    .values({
      workspaceId: input.workspaceId ?? null,
      userId: input.userId ?? null,
      actor: input.actor ?? null,
      action: input.action,
      target: input.target ?? null,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null
    })
    .catch((err) => log.warn({ err, action: input.action }, "audit insert failed"));
}

export function ipAndUaFromRequest(req: Request): { ipAddress: string | null; userAgent: string | null } {
  const fwd = req.headers.get("x-forwarded-for");
  const real = req.headers.get("x-real-ip");
  const ipAddress = fwd?.split(",")[0]?.trim() || real || null;
  const userAgent = req.headers.get("user-agent");
  return { ipAddress, userAgent };
}
