import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  jsonb,
  boolean,
  primaryKey,
  index
} from "drizzle-orm/pg-core";

// =============================================================================
// users + workspaces
// =============================================================================
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: timestamp("email_verified"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state")
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] })
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expires: timestamp("expires").notNull()
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] })
  })
);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  country: text("country"),
  plan: text("plan").default("free").notNull(), // free | pro | bulk | forwarder
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // KYB
  kybStatus: text("kyb_status").default("not_started").notNull(), // not_started | pending | verified | rejected
  kybProvider: text("kyb_provider"), // "smile" for Smile Identity
  kybJobId: text("kyb_job_id"),
  kybBusinessType: text("kyb_business_type"),
  kybRegistrationNumber: text("kyb_registration_number"),
  kybVerifiedAt: timestamp("kyb_verified_at"),
  kybRejectionReason: text("kyb_rejection_reason"),
  // Branding (Forwarder tier white-label)
  brandName: text("brand_name"),
  brandLogoUrl: text("brand_logo_url"),
  brandPrimaryColor: text("brand_primary_color"),
  brandFooterNote: text("brand_footer_note"),
  // Workspace preferences
  defaultOriginCountry: text("default_origin_country"),
  defaultLocale: text("default_locale").default("en").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").default("member").notNull(), // owner | admin | member
    joinedAt: timestamp("joined_at").defaultNow().notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workspaceId, t.userId] })
  })
);

export const workspaceInvitations = pgTable("workspace_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  email: text("email").notNull(),
  role: text("role").default("member").notNull(),
  invitedById: uuid("invited_by_id").references(() => users.id, { onDelete: "set null" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// =============================================================================
// waitlist
// =============================================================================
export const waitlist = pgTable("waitlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  company: text("company"),
  country: text("country"),
  source: text("source"),
  invitedAt: timestamp("invited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// =============================================================================
// AfriOrigin business records
// =============================================================================
export const determinations = pgTable(
  "determinations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    hsCode: text("hs_code"),
    confidence: numeric("confidence", { precision: 4, scale: 3 }),
    reasoning: text("reasoning"),
    originCountry: text("origin_country").notNull(),
    destinationCountry: text("destination_country").notNull(),
    quantity: numeric("quantity"),
    fobValueUsd: numeric("fob_value_usd"),
    qualifies: text("qualifies"), // yes | no | marginal
    ruleApplied: text("rule_applied"),
    mfnRate: numeric("mfn_rate"),
    afcftaRate: numeric("afcfta_rate"),
    savingsUsd: numeric("savings_usd"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    wsIdx: index("det_workspace_idx").on(t.workspaceId),
    createdIdx: index("det_created_idx").on(t.createdAt)
  })
);

export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  determinationId: uuid("determination_id").references(() => determinations.id, { onDelete: "set null" }),
  reference: text("reference").notNull().unique(), // e.g. AFCFTA-AB12CD34
  exporterName: text("exporter_name"),
  exporterAddress: text("exporter_address"),
  consigneeName: text("consignee_name"),
  consigneeAddress: text("consignee_address"),
  pdfUrl: text("pdf_url"),
  qrVerificationUrl: text("qr_verification_url"),
  endorsedByAuthority: boolean("endorsed_by_authority").default(false).notNull(),
  endorsedAt: timestamp("endorsed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// =============================================================================
// API keys (developer tier)
// =============================================================================
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  hashedKey: text("hashed_key").notNull(),
  prefix: text("prefix").notNull(), // sk_live_, sk_test_
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const apiUsage = pgTable(
  "api_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    apiKeyId: uuid("api_key_id").references(() => apiKeys.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    statusCode: integer("status_code"),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    keyIdx: index("usage_key_idx").on(t.apiKeyId),
    createdIdx: index("usage_created_idx").on(t.createdAt)
  })
);

// =============================================================================
// Webhooks
// =============================================================================
export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .references(() => workspaces.id, { onDelete: "cascade" })
    .notNull(),
  url: text("url").notNull(),
  description: text("description"),
  secret: text("secret").notNull(), // HMAC signing key
  events: jsonb("events").$type<string[]>().notNull().default([]),
  enabled: boolean("enabled").notNull().default(true),
  lastDeliveryAt: timestamp("last_delivery_at"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    endpointId: uuid("endpoint_id")
      .references(() => webhookEndpoints.id, { onDelete: "cascade" })
      .notNull(),
    event: text("event").notNull(),
    payload: jsonb("payload"),
    statusCode: integer("status_code"),
    responseBody: text("response_body"),
    durationMs: integer("duration_ms"),
    attempts: integer("attempts").notNull().default(1),
    succeeded: boolean("succeeded").notNull().default(false),
    nextRetryAt: timestamp("next_retry_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    endpointIdx: index("delivery_endpoint_idx").on(t.endpointId),
    createdIdx: index("delivery_created_idx").on(t.createdAt)
  })
);

// =============================================================================
// Audit log
// =============================================================================
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    actor: text("actor"), // human-readable when user is anonymous (e.g. api key name, "system")
    action: text("action").notNull(), // e.g. "determination.created", "webhook.endpoint.created"
    target: text("target"), // resource id this action applies to
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    wsIdx: index("audit_workspace_idx").on(t.workspaceId),
    createdIdx: index("audit_created_idx").on(t.createdAt),
    actionIdx: index("audit_action_idx").on(t.action)
  })
);

// =============================================================================
// Notifications (in-product)
// =============================================================================
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // certificate.issued | determination.marginal | billing.* | system.*
    title: text("title").notNull(),
    body: text("body"),
    target: text("target"), // resource id or path to deep-link
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    wsIdx: index("notif_workspace_idx").on(t.workspaceId),
    userIdx: index("notif_user_idx").on(t.userId),
    createdIdx: index("notif_created_idx").on(t.createdAt)
  })
);
