// Notification kind catalogue + defaults. Used by the prefs UI and the
// `notify()` helper to decide what to deliver in-product / by email.

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

export const NOTIFICATION_KINDS: Array<{
  kind: NotificationKind;
  label: string;
  description: string;
  group: "shipments" | "billing" | "compliance" | "system";
  defaultInProduct: boolean;
  defaultEmail: boolean;
}> = [
  {
    kind: "determination.qualified",
    label: "Shipment qualifies",
    description: "When AfriOrigin confirms a shipment meets AfCFTA Rules of Origin.",
    group: "shipments",
    defaultInProduct: true,
    defaultEmail: false
  },
  {
    kind: "determination.marginal",
    label: "Marginal determination",
    description: "RVC close to threshold — review the rule before issuing the certificate.",
    group: "shipments",
    defaultInProduct: true,
    defaultEmail: true
  },
  {
    kind: "determination.rejected",
    label: "Shipment did not qualify",
    description: "RoO failed — consider sourcing more inputs within AfCFTA.",
    group: "shipments",
    defaultInProduct: true,
    defaultEmail: true
  },
  {
    kind: "certificate.issued",
    label: "Certificate issued",
    description: "A new Certificate of Origin PDF is ready.",
    group: "shipments",
    defaultInProduct: true,
    defaultEmail: true
  },
  {
    kind: "certificate.endorsed",
    label: "Certificate endorsed",
    description: "A national competent authority has stamped one of your certificates.",
    group: "shipments",
    defaultInProduct: true,
    defaultEmail: true
  },
  {
    kind: "workspace.member_joined",
    label: "Member joined",
    description: "Someone accepted an invitation to your workspace.",
    group: "system",
    defaultInProduct: true,
    defaultEmail: false
  },
  {
    kind: "billing.upgraded",
    label: "Plan changed",
    description: "Your subscription was upgraded, downgraded, or renewed.",
    group: "billing",
    defaultInProduct: true,
    defaultEmail: true
  },
  {
    kind: "billing.payment_failed",
    label: "Payment failed",
    description: "Your card was declined or a Paystack/Flutterwave charge failed.",
    group: "billing",
    defaultInProduct: true,
    defaultEmail: true
  },
  {
    kind: "kyb.verified",
    label: "KYB approved",
    description: "Smile Identity verified your business registration.",
    group: "compliance",
    defaultInProduct: true,
    defaultEmail: true
  },
  {
    kind: "kyb.rejected",
    label: "KYB rejected",
    description: "Verification was rejected — see reason in /dashboard/verification.",
    group: "compliance",
    defaultInProduct: true,
    defaultEmail: true
  },
  {
    kind: "system.update",
    label: "Tariff schedule updates",
    description: "New AfCFTA tariff schedules published or significant rate changes.",
    group: "system",
    defaultInProduct: true,
    defaultEmail: false
  },
  {
    kind: "determination.created",
    label: "Every determination created",
    description: "Verbose — usually best left off in-product.",
    group: "shipments",
    defaultInProduct: false,
    defaultEmail: false
  }
];

export const NOTIFICATION_GROUPS = [
  { id: "shipments", label: "Shipments" },
  { id: "compliance", label: "Compliance & KYB" },
  { id: "billing", label: "Billing" },
  { id: "system", label: "System" }
] as const;
