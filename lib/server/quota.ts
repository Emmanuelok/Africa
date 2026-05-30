import { and, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

// Monthly limits per plan. Forwarder is unlimited (∞).
export const PLAN_LIMITS: Record<string, {
  determinationsPerMonth: number;
  certificatesPerMonth: number;
  membersMax: number;
  apiKeysMax: number;
  webhookEndpointsMax: number;
}> = {
  free: { determinationsPerMonth: 1, certificatesPerMonth: 0, membersMax: 2, apiKeysMax: 1, webhookEndpointsMax: 0 },
  pro: { determinationsPerMonth: Infinity, certificatesPerMonth: 5, membersMax: 2, apiKeysMax: 5, webhookEndpointsMax: 3 },
  bulk: { determinationsPerMonth: Infinity, certificatesPerMonth: 25, membersMax: 5, apiKeysMax: 20, webhookEndpointsMax: 10 },
  forwarder: { determinationsPerMonth: Infinity, certificatesPerMonth: Infinity, membersMax: Infinity, apiKeysMax: Infinity, webhookEndpointsMax: Infinity }
};

export type Quota = "determinationsPerMonth" | "certificatesPerMonth" | "membersMax" | "apiKeysMax" | "webhookEndpointsMax";

export type QuotaCheck =
  | { ok: true; remaining: number; limit: number }
  | { ok: false; used: number; limit: number; reason: string };

function firstOfThisMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

// Returns whether the workspace is within its plan limit for the given
// quota. Demo mode and DB-less mode always pass — same graceful pattern
// as elsewhere. Forwarder tier always passes.
export async function checkQuota(
  workspaceId: string,
  plan: string,
  quota: Quota
): Promise<QuotaCheck> {
  const limit = PLAN_LIMITS[plan]?.[quota] ?? PLAN_LIMITS.free[quota];
  if (limit === Infinity) return { ok: true, remaining: Infinity, limit };

  const db = getDb();
  if (!db || workspaceId === "demo-workspace") {
    return { ok: true, remaining: limit, limit };
  }

  let used = 0;
  const since = firstOfThisMonth();

  if (quota === "determinationsPerMonth") {
    const r = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.determinations)
      .where(and(eq(schema.determinations.workspaceId, workspaceId), gte(schema.determinations.createdAt, since)));
    used = r[0]?.c ?? 0;
  } else if (quota === "certificatesPerMonth") {
    const r = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.certificates)
      .where(and(eq(schema.certificates.workspaceId, workspaceId), gte(schema.certificates.createdAt, since)));
    used = r[0]?.c ?? 0;
  } else if (quota === "apiKeysMax") {
    const r = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.apiKeys)
      .where(and(eq(schema.apiKeys.workspaceId, workspaceId), sql`${schema.apiKeys.revokedAt} is null`));
    used = r[0]?.c ?? 0;
  } else if (quota === "webhookEndpointsMax") {
    const r = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.workspaceId, workspaceId));
    used = r[0]?.c ?? 0;
  } else if (quota === "membersMax") {
    const r = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.workspaceId, workspaceId));
    used = r[0]?.c ?? 0;
  }

  if (used >= limit) {
    return {
      ok: false,
      used,
      limit,
      reason: `Plan limit reached: ${used}/${limit === Infinity ? "∞" : limit} for ${quota}. Upgrade at /pricing to continue.`
    };
  }
  return { ok: true, remaining: limit - used, limit };
}
