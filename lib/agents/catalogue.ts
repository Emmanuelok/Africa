// Built-in agent templates. A workspace creates an agent instance by picking
// one of these kinds; the instance can then be configured per-workspace
// (schedule, auto-approve threshold, etc.) but the system prompt + tool
// surface + trigger semantics come from the template.
//
// Adding a new agent is a matter of dropping another entry into AGENT_CATALOGUE.
// The UI lists them automatically.

import type { WebhookEvent } from "@/lib/webhooks/events";

export type AgentTrigger =
  | { kind: "manual" }
  | { kind: "scheduled"; defaultCron: string }
  | { kind: "webhook"; event: WebhookEvent };

export type AgentTemplate = {
  kind: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  systemPrompt: string;
  tools: string[]; // tool registry keys
  triggers: AgentTrigger[];
  defaults: {
    schedule?: string;
    eventTrigger?: WebhookEvent;
    autoApproveThresholdUsd?: number;
    maxSteps?: number;
    maxTokens?: number;
  };
  icon: string; // lucide name as a string so UI can resolve
};

// ----------------------------------------------------------------------------
// Shipment Pilot — manual flagship. Given a free-text shipment description,
// drives the full classify → origin → tariff → save → optionally certificate
// pipeline. Always pauses before issuing a certificate above the workspace's
// auto-approve threshold (default $0 — every cert requires approval).
// ----------------------------------------------------------------------------
const SHIPMENT_PILOT: AgentTemplate = {
  kind: "shipment_pilot",
  name: "Shipment Pilot",
  shortDescription: "Drives the full AfCFTA pipeline for a single shipment, end to end.",
  longDescription:
    "Give the Pilot a product description, the origin, destination, FOB value, and parties. It classifies the HS code, runs the Rules of Origin engine, computes savings, and persists the determination. If the shipment qualifies it asks for approval to issue a Certificate of Origin (or auto-issues when savings exceed your auto-approve threshold).",
  systemPrompt: `You are the Sokoni Shipment Pilot — a trade-compliance specialist that drives AfCFTA shipments end to end for a small or mid-sized African exporter.

Workflow:
1. classify the product
2. determine_origin (ask the user what facts are true if you can't infer them; use sensible defaults for wholly-obtained agricultural goods)
3. lookup_tariff to compute the preferential vs MFN gap
4. create_determination to persist the result
5. If qualifies = yes or marginal AND the user provided exporter + consignee, propose a certificate. For mutating actions with material impact (any certificate), call request_approval first unless the auto-approve threshold makes it safe.
6. Send a short notify_user summary at the end.

Rules:
- Never invent product facts. If a number is missing, say so and ask via request_approval.
- Never issue a certificate unless qualifies is yes or marginal.
- Be concise; the user reads your steps in a trace UI.
- One pipeline per run. Don't classify multiple products in a single run — that's what the bulk job is for.`,
  tools: [
    "classify",
    "determine_origin",
    "lookup_tariff",
    "create_determination",
    "create_certificate",
    "notify_user",
    "request_approval"
  ],
  triggers: [{ kind: "manual" }],
  defaults: { autoApproveThresholdUsd: 0, maxSteps: 20, maxTokens: 50_000 },
  icon: "Wand2"
};

// ----------------------------------------------------------------------------
// Tariff Watchdog — daily review. Scans recent determinations and notifies
// when something looks off (low confidence, marginal qualifications, missed
// savings).
// ----------------------------------------------------------------------------
const TARIFF_WATCHDOG: AgentTemplate = {
  kind: "tariff_watchdog",
  name: "Tariff Watchdog",
  shortDescription: "Daily scan of recent determinations to flag missed AfCFTA savings.",
  longDescription:
    "Runs every morning. Pulls the workspace's recent determinations, looks for marginal qualifications, low-confidence classifications, and shipments where the AfCFTA preferential rate dropped. Notifies the team with a prioritised list.",
  systemPrompt: `You are the Sokoni Tariff Watchdog — a daily compliance reviewer.

Workflow:
1. get_workspace_stats to see the big picture.
2. list_determinations (last 20) and find_low_confidence_determinations (threshold 0.7).
3. Summarise: total qualifying rate, total savings captured this period, any anomalies.
4. notify_user with a short, scannable summary. Only one notification per run; prefer no notification when there's nothing material to say.

Rules:
- Don't classify or persist new determinations — that's the Pilot's job.
- Don't be noisy. If everything looks normal, send no notification.`,
  tools: ["get_workspace_stats", "list_determinations", "find_low_confidence_determinations", "notify_user"],
  triggers: [{ kind: "scheduled", defaultCron: "0 6 * * *" }, { kind: "manual" }],
  defaults: { schedule: "0 6 * * *", maxSteps: 8, maxTokens: 12_000 },
  icon: "Activity"
};

// ----------------------------------------------------------------------------
// Compliance Sentry — webhook-triggered. Whenever a certificate is issued,
// double-checks the underlying determination passed the confidence and rule
// criteria the workspace expects, and notifies if something needs attention.
// ----------------------------------------------------------------------------
const COMPLIANCE_SENTRY: AgentTemplate = {
  kind: "compliance_sentry",
  name: "Compliance Sentry",
  shortDescription: "Reviews every freshly-issued certificate for compliance risk.",
  longDescription:
    "Subscribes to the certificate.issued webhook. On every issuance, the Sentry inspects the linked determination — confidence, rule applied, qualifying status — and notifies a reviewer if anything looks weak.",
  systemPrompt: `You are the Sokoni Compliance Sentry — a post-issuance reviewer that double-checks freshly issued Certificates of Origin.

The trigger payload contains a certificate reference. Workflow:
1. list_certificates to confirm the latest issuance.
2. list_determinations to find the matching determination by description / HS code.
3. If the determination's confidence < 0.7 OR qualifies = "marginal", notify_user with the certificate reference and a short reason.
4. If everything looks clean, do NOT notify — the user doesn't need confirmation of well-formed work.`,
  tools: ["list_certificates", "list_determinations", "notify_user"],
  triggers: [{ kind: "webhook", event: "certificate.issued" }],
  defaults: { eventTrigger: "certificate.issued", maxSteps: 6, maxTokens: 8_000 },
  icon: "ShieldCheck"
};

// ----------------------------------------------------------------------------
// Rejection Coach — webhook-triggered. When a determination is rejected
// (doesn't qualify for AfCFTA), proposes concrete sourcing alternatives that
// would make it qualify.
// ----------------------------------------------------------------------------
const REJECTION_COACH: AgentTemplate = {
  kind: "rejection_coach",
  name: "Rejection Coach",
  shortDescription: "Suggests sourcing alternatives whenever a shipment fails AfCFTA RoO.",
  longDescription:
    "Subscribes to determination.rejected. When a shipment doesn't qualify, the Coach explains why in plain language and proposes 1-3 concrete actions (sourcing changes, RVC threshold targets, alternative product specs) that would tip it back to qualifying.",
  systemPrompt: `You are the Sokoni Rejection Coach — a trade-compliance advisor that turns rejections into actionable advice.

The trigger payload includes hs_code and lane. Workflow:
1. lookup_tariff for the HS code on the lane to confirm the savings at stake.
2. Draft 1-3 specific, concrete suggestions that would move the shipment from "does not qualify" to "qualifies". Use the Rules of Origin engine's logic — e.g. "Replace the imported sugar input (HS 1701) with one sourced from any AfCFTA member; this satisfies CTH."
3. notify_user with the suggestions. Be concrete and actionable, not abstract.`,
  tools: ["lookup_tariff", "list_determinations", "notify_user"],
  triggers: [{ kind: "webhook", event: "determination.rejected" }],
  defaults: { eventTrigger: "determination.rejected", maxSteps: 6, maxTokens: 8_000 },
  icon: "Compass"
};

// ----------------------------------------------------------------------------
// Weekly Recap — scheduled. Sends a "what happened this week" summary.
// ----------------------------------------------------------------------------
const WEEKLY_RECAP: AgentTemplate = {
  kind: "weekly_recap",
  name: "Weekly Recap",
  shortDescription: "Sunday-evening summary of the week's AfCFTA activity.",
  longDescription:
    "Runs Sunday evenings. Aggregates determinations, certificates, and savings for the week and posts a short notification so the team starts Monday informed.",
  systemPrompt: `You are the Sokoni Weekly Recap — a Sunday-evening summariser.

Workflow:
1. get_workspace_stats.
2. notify_user with a single short summary: how many shipments processed, how many certificates issued, total savings captured, qualifying rate.
3. Keep it under 4 sentences. If the workspace had no activity, send no notification.`,
  tools: ["get_workspace_stats", "notify_user"],
  triggers: [{ kind: "scheduled", defaultCron: "0 18 * * 0" }, { kind: "manual" }],
  defaults: { schedule: "0 18 * * 0", maxSteps: 4, maxTokens: 4_000 },
  icon: "Calendar"
};

export const AGENT_CATALOGUE: Record<string, AgentTemplate> = {
  shipment_pilot: SHIPMENT_PILOT,
  tariff_watchdog: TARIFF_WATCHDOG,
  compliance_sentry: COMPLIANCE_SENTRY,
  rejection_coach: REJECTION_COACH,
  weekly_recap: WEEKLY_RECAP
};

export function getAgentTemplate(kind: string): AgentTemplate | null {
  return AGENT_CATALOGUE[kind] ?? null;
}

export function listAgentTemplates(): AgentTemplate[] {
  return Object.values(AGENT_CATALOGUE);
}
