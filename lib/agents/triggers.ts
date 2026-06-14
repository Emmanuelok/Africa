// Autonomous trigger plumbing. Two entry points:
//
//   enqueueEventRuns()  — called (lazily) from the webhook dispatcher when a
//                         Sokoni event fires. Creates a *queued* run for every
//                         enabled agent subscribed to that event. Cheap: a
//                         single query + inserts, no model calls.
//
//   runDueAgents()      — called by the /api/cron/agents cron. Executes (a)
//                         scheduled agents whose nextRunAt has passed and (b)
//                         any queued runs left by event triggers. This is where
//                         the model loop actually runs.
//
// Decoupling enqueue from execution keeps the request path fast and makes agent
// execution resilient to the serverless lifecycle: a run survives as a row
// until the cron picks it up.

import { and, eq, lte, isNotNull, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { log } from "@/lib/log";
import { getAgentTemplate } from "@/lib/agents/catalogue";
import { createRun } from "@/lib/agents/runs";
import { nextCronRun } from "@/lib/agents/store";
import type { WebhookEvent } from "@/lib/webhooks/events";

// Build a natural-language goal for an event-triggered run from the payload.
function eventGoal(event: string, object: Record<string, unknown>): string {
  const ref = object.reference ?? object.id ?? "";
  switch (event) {
    case "certificate.issued":
      return `A certificate (${ref}) was just issued. Review the underlying determination for compliance risk and notify a reviewer only if something looks weak.`;
    case "determination.rejected":
      return `A shipment determination (${object.hs_code ?? ref}) did not qualify for AfCFTA. Suggest concrete sourcing changes that would make it qualify, then notify the user.`;
    default:
      return `The "${event}" event fired (${ref}). Take the appropriate action for your role.`;
  }
}

export async function enqueueEventRuns(
  workspaceId: string,
  event: WebhookEvent,
  object: Record<string, unknown>
): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  try {
    const agents = await db
      .select()
      .from(schema.agents)
      .where(and(eq(schema.agents.workspaceId, workspaceId), eq(schema.agents.eventTrigger, event), eq(schema.agents.enabled, true)));

    let queued = 0;
    for (const a of agents) {
      await createRun({
        agentId: a.id,
        workspaceId,
        goal: eventGoal(event, object),
        triggeredBy: "webhook",
        triggerPayload: { event, object }
      });
      queued++;
    }
    if (queued > 0) log.info({ workspaceId, event, queued }, "enqueued event-triggered agent runs");
    return queued;
  } catch (err) {
    log.warn({ err, workspaceId, event }, "enqueueEventRuns failed");
    return 0;
  }
}

export type CronSummary = {
  scheduledDue: number;
  scheduledRan: number;
  queuedRan: number;
  errors: number;
};

// Execute due scheduled agents and any queued (event-triggered) runs. Bounded
// per invocation to stay within the cron function budget.
export async function runDueAgents(limit = 10): Promise<CronSummary> {
  const db = getDb();
  const summary: CronSummary = { scheduledDue: 0, scheduledRan: 0, queuedRan: 0, errors: 0 };
  if (!db) return summary;

  // Lazy import keeps the engine (and its model client) out of modules that
  // only enqueue.
  const { executeRun } = await import("@/lib/agents/engine");

  // 1) Scheduled agents that are due.
  const now = new Date();
  const dueAgents = await db
    .select()
    .from(schema.agents)
    .where(and(eq(schema.agents.enabled, true), isNotNull(schema.agents.nextRunAt), lte(schema.agents.nextRunAt, now)))
    .limit(limit);
  summary.scheduledDue = dueAgents.length;

  for (const a of dueAgents) {
    try {
      // Advance the schedule first so a slow/failed run can't cause re-fire.
      await db
        .update(schema.agents)
        .set({ lastRunAt: now, nextRunAt: a.schedule ? nextCronRun(a.schedule, now) : null })
        .where(eq(schema.agents.id, a.id));

      const template = getAgentTemplate(a.kind);
      const run = await createRun({
        agentId: a.id,
        workspaceId: a.workspaceId,
        goal: template ? `Scheduled run: ${template.shortDescription}` : "Scheduled run.",
        triggeredBy: "cron"
      });
      await executeRun(run.id);
      summary.scheduledRan++;
    } catch (err) {
      summary.errors++;
      log.warn({ err, agentId: a.id }, "scheduled agent run failed");
    }
  }

  // 2) Queued runs left by event triggers (and not yet started).
  const queued = await db
    .select()
    .from(schema.agentRuns)
    .where(and(eq(schema.agentRuns.status, "queued"), isNull(schema.agentRuns.startedAt)))
    .limit(limit);

  for (const r of queued) {
    try {
      await executeRun(r.id);
      summary.queuedRan++;
    } catch (err) {
      summary.errors++;
      log.warn({ err, runId: r.id }, "queued agent run failed");
    }
  }

  return summary;
}
