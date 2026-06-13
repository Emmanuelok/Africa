// Webhook event taxonomy. Match what /docs/api/webhooks promises.

export const WEBHOOK_EVENTS = [
  "classification.completed",
  "determination.created",
  "determination.qualified",
  "determination.marginal",
  "determination.rejected",
  "certificate.issued",
  "certificate.endorsed",
  "certificate.revoked",
  "workspace.upgraded",
  "workspace.downgraded"
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type WebhookPayload<T = Record<string, unknown>> = {
  id: string; // evt_xxx
  type: WebhookEvent;
  created: number; // unix seconds
  data: { object: T };
};
