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
  // TOTP 2FA
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  totpRecoveryCodes: jsonb("totp_recovery_codes").$type<string[]>(),
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
  // Revocation — a Certificate of Origin issued in error must be invalidatable.
  // The public /verify page reflects this state.
  revokedAt: timestamp("revoked_at"),
  revokedReason: text("revoked_reason"),
  revokedById: uuid("revoked_by_id").references(() => users.id, { onDelete: "set null" }),
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
  // Per-endpoint scopes: ["*"] = full access. Names match the v1 endpoint
  // path segments: classify, determine-origin, tariff, certificates, shipments.
  scopes: jsonb("scopes").$type<string[]>().notNull().default(["*"]),
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
// Bulk classification jobs — when QStash is configured, large CSVs run async
// via /api/bulk-classify/worker; when not, the request handler processes
// inline (same as before).
// =============================================================================
export const bulkJobs = pgTable(
  "bulk_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status").notNull().default("queued"), // queued | running | completed | failed | partial
    totalRows: integer("total_rows").notNull(),
    processedRows: integer("processed_rows").notNull().default(0),
    qualifying: integer("qualifying").notNull().default(0),
    marginal: integer("marginal").notNull().default(0),
    errors: integer("errors").notNull().default(0),
    totalSavingsUsd: numeric("total_savings_usd"),
    csvInput: text("csv_input").notNull(),
    csvOutput: text("csv_output"),
    error: text("error"),
    queuedAt: timestamp("queued_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at")
  },
  (t) => ({
    wsIdx: index("bulk_workspace_idx").on(t.workspaceId),
    createdIdx: index("bulk_queued_idx").on(t.queuedAt)
  })
);

// =============================================================================
// Suppressed emails — bounces, complaints, hard fails. Resend posts to
// /api/webhooks/resend and we record the address here. sendEmail() consults
// this list before delivering to anything (transactional, magic links, digest).
// =============================================================================
export const suppressedEmails = pgTable(
  "suppressed_emails",
  {
    email: text("email").primaryKey(),
    reason: text("reason").notNull(), // "bounce" | "complaint" | "hard_bounce" | "manual"
    detail: text("detail"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    createdIdx: index("suppressed_created_idx").on(t.createdAt)
  })
);

// =============================================================================
// Notification preferences (per-user, per-kind email/in-product toggles)
// =============================================================================
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    kind: text("kind").notNull(), // matches NotificationKind values
    inProduct: boolean("in_product").notNull().default(true),
    email: boolean("email").notNull().default(false),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.kind] })
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

// =============================================================================
// Status incidents — backs the public /status page. Operators post incidents
// and updates here; the page renders real history rather than a static list.
// =============================================================================
export const statusIncidents = pgTable(
  "status_incidents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    // investigating | identified | monitoring | resolved
    status: text("status").notNull().default("investigating"),
    // none | minor | major | critical
    impact: text("impact").notNull().default("minor"),
    // affected component keys (database, redis, anthropic, app, …)
    components: jsonb("components").$type<string[]>().notNull().default([]),
    body: text("body"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    startedIdx: index("incident_started_idx").on(t.startedAt)
  })
);

// =============================================================================
// Agents — long-running, stateful automations that watch for events and take
// action on the user's behalf. Each agent is an instance of a built-in
// template (kind) configured for one workspace. Triggers: manual run, cron
// schedule, or webhook event.
// =============================================================================
export const agents = pgTable(
  "agents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    kind: text("kind").notNull(), // template identifier — see lib/agents/catalogue.ts
    name: text("name").notNull(),
    description: text("description"),
    enabled: boolean("enabled").notNull().default(true),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    // Schedule: cron expression in UTC, e.g. "0 6 * * *" (daily 06:00 UTC).
    schedule: text("schedule"),
    // Webhook event trigger — when the named Sokoni webhook event fires, the
    // engine spawns a run with the payload. Matches lib/webhooks/events.ts.
    eventTrigger: text("event_trigger"),
    // Operator policy: above this confidence/savings threshold the agent
    // auto-executes; below it, the engine pauses for human approval.
    autoApproveThreshold: numeric("auto_approve_threshold"),
    // Hard limits — the engine refuses to exceed these.
    maxSteps: integer("max_steps").notNull().default(20),
    maxTokens: integer("max_tokens").notNull().default(50_000),
    lastRunAt: timestamp("last_run_at"),
    nextRunAt: timestamp("next_run_at"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (t) => ({
    wsIdx: index("agent_workspace_idx").on(t.workspaceId),
    eventIdx: index("agent_event_idx").on(t.eventTrigger),
    nextRunIdx: index("agent_next_run_idx").on(t.nextRunAt)
  })
);

export const agentRuns = pgTable(
  "agent_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    // queued | running | awaiting_approval | succeeded | failed | cancelled
    status: text("status").notNull().default("queued"),
    triggeredBy: text("triggered_by").notNull(), // manual | cron | webhook | api
    triggeredById: uuid("triggered_by_id").references(() => users.id, { onDelete: "set null" }),
    triggerPayload: jsonb("trigger_payload"),
    goal: text("goal"), // user-supplied goal or templated from the trigger
    summary: text("summary"), // final assistant message
    error: text("error"),
    // Resume state for runs that pause on an approval. Holds the committed
    // Anthropic message array plus the pending assistant turn / partial tool
    // results so the engine can continue exactly where it stopped.
    state: jsonb("state").$type<Record<string, unknown>>(),
    stepCount: integer("step_count").notNull().default(0),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    agentIdx: index("agent_run_agent_idx").on(t.agentId),
    wsIdx: index("agent_run_workspace_idx").on(t.workspaceId),
    statusIdx: index("agent_run_status_idx").on(t.status),
    createdIdx: index("agent_run_created_idx").on(t.createdAt)
  })
);

export const agentSteps = pgTable(
  "agent_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id").references(() => agentRuns.id, { onDelete: "cascade" }).notNull(),
    idx: integer("idx").notNull(), // 0-indexed step number within the run
    kind: text("kind").notNull(), // llm_text | tool_call | tool_result | approval_request | approval_resolved
    name: text("name"), // for tool_call/tool_result: the tool name
    input: jsonb("input"),
    output: jsonb("output"),
    durationMs: integer("duration_ms"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    runIdx: index("agent_step_run_idx").on(t.runId)
  })
);

export const agentApprovals = pgTable(
  "agent_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    runId: uuid("run_id").references(() => agentRuns.id, { onDelete: "cascade" }).notNull(),
    stepId: uuid("step_id").references(() => agentSteps.id, { onDelete: "cascade" }).notNull(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    question: text("question").notNull(),
    payload: jsonb("payload"), // what the agent wants to do
    toolName: text("tool_name"),
    decidedAt: timestamp("decided_at"),
    decidedById: uuid("decided_by_id").references(() => users.id, { onDelete: "set null" }),
    decision: text("decision"), // approve | decline
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    runIdx: index("agent_approval_run_idx").on(t.runId),
    wsIdx: index("agent_approval_workspace_idx").on(t.workspaceId)
  })
);

// =============================================================================
// Collaboration — Projects
// -----------------------------------------------------------------------------
// A Project is a shared room that people from different workspaces and even
// different organisations can collaborate in. Two flavours today:
//   - "trade" : a real shipment/compliance project — co-ordinate a determination
//               or certificate across exporter, forwarder, and buyer.
//   - "study" : a learning cohort — students working through the same AfCFTA
//               topic together, sharing notes and questions.
// Membership is project-scoped and independent of workspace membership, so an
// invited friend from another org joins the project without joining your
// workspace. People join by email invite or by a shareable link.
// =============================================================================
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // The workspace that owns/hosts the project (billing + quota anchor).
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    kind: text("kind").notNull().default("trade"), // trade | study
    name: text("name").notNull(),
    topic: text("topic"), // for study rooms: the subject, e.g. "Rules of Origin"
    description: text("description"),
    // private = invite/link only; link = anyone with the link can join; the
    // distinction is enforced at the invite layer.
    visibility: text("visibility").notNull().default("private"),
    color: text("color"), // accent for the project card
    archivedAt: timestamp("archived_at"),
    settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (t) => ({
    wsIdx: index("project_workspace_idx").on(t.workspaceId),
    kindIdx: index("project_kind_idx").on(t.kind)
  })
);

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    role: text("role").notNull().default("editor"), // owner | editor | viewer
    // Snapshot of identity at join time — lets us show "Ada from Kano Mills"
    // without a join, and survives the user editing their profile.
    displayName: text("display_name"),
    email: text("email"),
    organization: text("organization"), // their home workspace / org name
    joinedVia: text("joined_via").notNull().default("invite"), // owner | link | email | invite
    lastSeenAt: timestamp("last_seen_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    projectIdx: index("project_member_project_idx").on(t.projectId),
    userIdx: index("project_member_user_idx").on(t.userId),
    uniq: index("project_member_uniq_idx").on(t.projectId, t.userId)
  })
);

// Shareable join links. A single token can be configured for many uses or a
// single use, with an optional expiry. Anyone who opens /join/<token> and signs
// in becomes a project member with the link's role.
export const projectInvites = pgTable(
  "project_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    token: text("token").notNull().unique(),
    role: text("role").notNull().default("editor"),
    // Optional targeted email invite; null = open shareable link.
    email: text("email"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    maxUses: integer("max_uses"), // null = unlimited
    uses: integer("uses").notNull().default(0),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    projectIdx: index("project_invite_project_idx").on(t.projectId)
  })
);

// The collaborative feed: messages, shared notes, pinned resources, and system
// events (member joined, resource attached). One table keeps the room timeline
// simple; `kind` discriminates rendering.
export const projectEvents = pgTable(
  "project_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: text("author_name"), // identity snapshot for display
    kind: text("kind").notNull().default("message"), // message | note | resource | system | question | answer
    body: text("body"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    // Optional links to platform records shared into the room.
    determinationId: uuid("determination_id").references(() => determinations.id, { onDelete: "set null" }),
    certificateId: uuid("certificate_id").references(() => certificates.id, { onDelete: "set null" }),
    pinned: boolean("pinned").notNull().default(false),
    editedAt: timestamp("edited_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (t) => ({
    projectIdx: index("project_event_project_idx").on(t.projectId),
    createdIdx: index("project_event_created_idx").on(t.createdAt)
  })
);
