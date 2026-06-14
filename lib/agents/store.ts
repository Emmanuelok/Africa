// Agent instance CRUD. An "agent" row is a per-workspace configured instance
// of a catalogue template (lib/agents/catalogue.ts). This module owns the
// database access; routes call these helpers.
//
// Demo mode (no DATABASE_URL): we surface a couple of pre-wired agents so the
// dashboard is explorable, and writes become no-ops.

import { and, desc, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getDb, schema } from "@/lib/db/client";
import { getAgentTemplate, type AgentTemplate } from "@/lib/agents/catalogue";

export type AgentRow = typeof schema.agents.$inferSelect;

export type AgentView = {
  id: string;
  kind: string;
  name: string;
  description: string | null;
  enabled: boolean;
  schedule: string | null;
  eventTrigger: string | null;
  autoApproveThresholdUsd: number | null;
  maxSteps: number;
  maxTokens: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  // From the template — the UI needs it for icon / trigger semantics.
  template: AgentTemplate | null;
};

function toView(r: AgentRow): AgentView {
  return {
    id: r.id,
    kind: r.kind,
    name: r.name,
    description: r.description,
    enabled: r.enabled,
    schedule: r.schedule,
    eventTrigger: r.eventTrigger,
    autoApproveThresholdUsd: r.autoApproveThreshold != null ? Number(r.autoApproveThreshold) : null,
    maxSteps: r.maxSteps,
    maxTokens: r.maxTokens,
    lastRunAt: r.lastRunAt ? r.lastRunAt.toISOString() : null,
    nextRunAt: r.nextRunAt ? r.nextRunAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    template: getAgentTemplate(r.kind)
  };
}

const DEMO_AGENTS: AgentView[] = [
  {
    id: "agent_demo_pilot",
    kind: "shipment_pilot",
    name: "Shipment Pilot",
    description: "Drives the full AfCFTA pipeline for a single shipment.",
    enabled: true,
    schedule: null,
    eventTrigger: null,
    autoApproveThresholdUsd: 0,
    maxSteps: 20,
    maxTokens: 50_000,
    lastRunAt: "2026-06-13T08:12:00Z",
    nextRunAt: null,
    createdAt: "2026-05-30T10:00:00Z",
    template: getAgentTemplate("shipment_pilot")
  },
  {
    id: "agent_demo_watchdog",
    kind: "tariff_watchdog",
    name: "Tariff Watchdog",
    description: "Daily scan of recent determinations to flag missed savings.",
    enabled: true,
    schedule: "0 6 * * *",
    eventTrigger: null,
    autoApproveThresholdUsd: null,
    maxSteps: 8,
    maxTokens: 12_000,
    lastRunAt: "2026-06-14T06:00:00Z",
    nextRunAt: "2026-06-15T06:00:00Z",
    createdAt: "2026-05-30T10:05:00Z",
    template: getAgentTemplate("tariff_watchdog")
  }
];

export function demoAgents(): AgentView[] {
  return DEMO_AGENTS;
}

export async function listAgents(workspaceId: string): Promise<AgentView[]> {
  const db = getDb();
  if (!db || workspaceId === "demo-workspace") return DEMO_AGENTS;
  const rows = await db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.workspaceId, workspaceId))
    .orderBy(desc(schema.agents.createdAt));
  return rows.map(toView);
}

export async function getAgent(workspaceId: string, id: string): Promise<AgentView | null> {
  const db = getDb();
  if (!db || workspaceId === "demo-workspace") return DEMO_AGENTS.find((a) => a.id === id) ?? null;
  const rows = await db.select().from(schema.agents).where(eq(schema.agents.id, id)).limit(1);
  const r = rows[0];
  if (!r || r.workspaceId !== workspaceId) return null;
  return toView(r);
}

export type CreateAgentInput = {
  workspaceId: string;
  kind: string;
  name?: string;
  description?: string;
  schedule?: string | null;
  autoApproveThresholdUsd?: number | null;
  createdById?: string | null;
};

export async function createAgent(input: CreateAgentInput): Promise<AgentView | null> {
  const template = getAgentTemplate(input.kind);
  if (!template) return null;

  const schedule = input.schedule ?? template.defaults.schedule ?? null;
  const eventTrigger = template.defaults.eventTrigger ?? null;
  const autoApprove =
    input.autoApproveThresholdUsd !== undefined
      ? input.autoApproveThresholdUsd
      : template.defaults.autoApproveThresholdUsd ?? null;

  const db = getDb();
  if (!db || input.workspaceId === "demo-workspace") {
    return {
      id: `agent_demo_${randomBytes(4).toString("hex")}`,
      kind: input.kind,
      name: input.name ?? template.name,
      description: input.description ?? template.shortDescription,
      enabled: true,
      schedule,
      eventTrigger,
      autoApproveThresholdUsd: autoApprove,
      maxSteps: template.defaults.maxSteps ?? 20,
      maxTokens: template.defaults.maxTokens ?? 50_000,
      lastRunAt: null,
      nextRunAt: schedule ? nextCronRun(schedule).toISOString() : null,
      createdAt: new Date().toISOString(),
      template
    };
  }

  const rows = await db
    .insert(schema.agents)
    .values({
      workspaceId: input.workspaceId,
      kind: input.kind,
      name: input.name ?? template.name,
      description: input.description ?? template.shortDescription,
      schedule,
      eventTrigger,
      autoApproveThreshold: autoApprove != null ? String(autoApprove) : null,
      maxSteps: template.defaults.maxSteps ?? 20,
      maxTokens: template.defaults.maxTokens ?? 50_000,
      nextRunAt: schedule ? nextCronRun(schedule) : null,
      createdById: input.createdById ?? null
    })
    .returning();
  return toView(rows[0]);
}

export type UpdateAgentInput = {
  name?: string;
  description?: string | null;
  enabled?: boolean;
  schedule?: string | null;
  autoApproveThresholdUsd?: number | null;
  maxSteps?: number;
  maxTokens?: number;
};

export async function updateAgent(
  workspaceId: string,
  id: string,
  patch: UpdateAgentInput
): Promise<AgentView | null> {
  const db = getDb();
  if (!db || workspaceId === "demo-workspace") return getAgent(workspaceId, id);

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.enabled !== undefined) set.enabled = patch.enabled;
  if (patch.schedule !== undefined) {
    set.schedule = patch.schedule;
    set.nextRunAt = patch.schedule ? nextCronRun(patch.schedule) : null;
  }
  if (patch.autoApproveThresholdUsd !== undefined)
    set.autoApproveThreshold = patch.autoApproveThresholdUsd != null ? String(patch.autoApproveThresholdUsd) : null;
  if (patch.maxSteps !== undefined) set.maxSteps = patch.maxSteps;
  if (patch.maxTokens !== undefined) set.maxTokens = patch.maxTokens;

  const rows = await db
    .update(schema.agents)
    .set(set)
    .where(and(eq(schema.agents.id, id), eq(schema.agents.workspaceId, workspaceId)))
    .returning();
  return rows[0] ? toView(rows[0]) : null;
}

export async function deleteAgent(workspaceId: string, id: string): Promise<boolean> {
  const db = getDb();
  if (!db || workspaceId === "demo-workspace") return true;
  const rows = await db
    .delete(schema.agents)
    .where(and(eq(schema.agents.id, id), eq(schema.agents.workspaceId, workspaceId)))
    .returning({ id: schema.agents.id });
  return rows.length > 0;
}

// Mark a run scheduled — bump lastRunAt/nextRunAt after a run kicks off.
export async function markAgentRan(agentId: string, schedule: string | null): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(schema.agents)
    .set({ lastRunAt: new Date(), nextRunAt: schedule ? nextCronRun(schedule) : null })
    .where(eq(schema.agents.id, agentId));
}

// ---------------------------------------------------------------------------
// Minimal cron "next run" estimator. We only support the subset our templates
// use: "M H * * D" (minute, hour, any day-of-month, any month, day-of-week).
// Good enough to show the user when an agent will next fire; the cron route
// re-derives due agents from the stored nextRunAt.
// ---------------------------------------------------------------------------
export function nextCronRun(expr: string, from: Date = new Date()): Date {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return new Date(from.getTime() + 24 * 3600_000);
  const [minS, hourS, , , dowS] = parts;
  const minute = minS === "*" ? 0 : parseInt(minS, 10) || 0;
  const hour = hourS === "*" ? 0 : parseInt(hourS, 10) || 0;

  const candidate = new Date(from);
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(minute);
  candidate.setUTCHours(hour);

  // Specific day-of-week (0-6, Sun=0).
  const targetDow = dowS === "*" ? null : parseInt(dowS, 10);

  // Advance day by day until we satisfy both the time-of-day (in the future)
  // and the day-of-week constraint. Cap at 8 iterations.
  for (let i = 0; i < 8; i++) {
    if (candidate > from && (targetDow == null || candidate.getUTCDay() === targetDow)) {
      return candidate;
    }
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return candidate;
}
