import { cookies } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

export const ACTIVE_WORKSPACE_COOKIE = "sokoni_ws";

export type WorkspaceSummary = {
  id: string;
  name: string;
  plan: "free" | "pro" | "bulk" | "forwarder";
  role: "owner" | "admin" | "member";
};

// List every workspace the user is a member of, with their role.
export async function listWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]> {
  const db = getDb();
  if (!db) return [];

  const memberships = await db
    .select()
    .from(schema.workspaceMembers)
    .where(eq(schema.workspaceMembers.userId, userId));

  if (memberships.length === 0) return [];

  const ids = memberships.map((m) => m.workspaceId);
  const rows = await db
    .select()
    .from(schema.workspaces)
    .where(inArray(schema.workspaces.id, ids));

  return rows.map((r) => {
    const role = memberships.find((m) => m.workspaceId === r.id)?.role as WorkspaceSummary["role"];
    return {
      id: r.id,
      name: r.name,
      plan: (r.plan as WorkspaceSummary["plan"]) ?? "free",
      role: role ?? "member"
    };
  });
}

// Active workspace id from cookie, validated against the user's memberships.
export function getActiveWorkspaceIdFromCookie(): string | null {
  const c = cookies().get(ACTIVE_WORKSPACE_COOKIE);
  return c?.value ?? null;
}

export function pickActiveWorkspace(
  workspaces: WorkspaceSummary[],
  preferredId: string | null
): WorkspaceSummary | null {
  if (workspaces.length === 0) return null;
  if (preferredId) {
    const match = workspaces.find((w) => w.id === preferredId);
    if (match) return match;
  }
  // Prefer owner role, then admin, then first
  return (
    workspaces.find((w) => w.role === "owner") ??
    workspaces.find((w) => w.role === "admin") ??
    workspaces[0]
  );
}
