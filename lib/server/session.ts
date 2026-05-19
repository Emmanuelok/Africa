import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import {
  listWorkspacesForUser,
  pickActiveWorkspace,
  getActiveWorkspaceIdFromCookie,
  type WorkspaceSummary
} from "@/lib/server/workspace";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  workspaceId: string;
  workspaceName: string;
  plan: "free" | "pro" | "bulk" | "forwarder";
  role: "owner" | "admin" | "member";
  workspaces: WorkspaceSummary[];
  isDemo: boolean;
};

const DEMO_WORKSPACES: WorkspaceSummary[] = [
  { id: "demo-workspace", name: "Highlands Coffee Cooperative", plan: "pro", role: "owner" },
  { id: "demo-workspace-2", name: "Nairobi Roasters Ltd", plan: "free", role: "admin" }
];

export const DEMO_USER: SessionUser = {
  id: "demo-user",
  email: "demo@sokoni.africa",
  name: "Amara Okonkwo",
  image: null,
  workspaceId: "demo-workspace",
  workspaceName: "Highlands Coffee Cooperative",
  plan: "pro",
  role: "owner",
  workspaces: DEMO_WORKSPACES,
  isDemo: true
};

export async function getSessionUser(): Promise<SessionUser> {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) return DEMO_USER;

    const db = getDb();
    if (!db) {
      return { ...DEMO_USER, email, name: session.user?.name ?? null };
    }

    const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    const user = rows[0];
    if (!user) return DEMO_USER;

    let workspaces = await listWorkspacesForUser(user.id);

    // First-time user — provision a default workspace.
    if (workspaces.length === 0) {
      const created = await db
        .insert(schema.workspaces)
        .values({ name: user.name ?? user.email, plan: "free" })
        .returning({ id: schema.workspaces.id, name: schema.workspaces.name, plan: schema.workspaces.plan });
      await db.insert(schema.workspaceMembers).values({
        workspaceId: created[0].id,
        userId: user.id,
        role: "owner"
      });
      workspaces = [{
        id: created[0].id,
        name: created[0].name,
        plan: (created[0].plan as WorkspaceSummary["plan"]) ?? "free",
        role: "owner"
      }];
    }

    const preferred = getActiveWorkspaceIdFromCookie();
    const active = pickActiveWorkspace(workspaces, preferred)!;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      workspaceId: active.id,
      workspaceName: active.name,
      plan: active.plan,
      role: active.role,
      workspaces,
      isDemo: false
    };
  } catch (err) {
    console.warn("[session] error, falling back to demo:", err);
    return DEMO_USER;
  }
}
