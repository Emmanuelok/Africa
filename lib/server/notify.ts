import { getDb, schema } from "@/lib/db/client";

export type NotificationKind =
  | "determination.created"
  | "determination.qualified"
  | "determination.marginal"
  | "determination.rejected"
  | "certificate.issued"
  | "certificate.endorsed"
  | "workspace.member_joined"
  | "billing.upgraded"
  | "billing.payment_failed"
  | "kyb.verified"
  | "kyb.rejected"
  | "system.update";

export type NotifyInput = {
  workspaceId: string;
  userId?: string | null;
  kind: NotificationKind;
  title: string;
  body?: string;
  target?: string;
};

export function notify(input: NotifyInput): void {
  const db = getDb();
  if (!db) return;
  void db
    .insert(schema.notifications)
    .values({
      workspaceId: input.workspaceId,
      userId: input.userId ?? null,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      target: input.target ?? null
    })
    .catch((err) => console.warn("[notify] insert failed:", err));
}
