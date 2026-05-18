import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  workspaceId: string;
  workspaceName: string;
  plan: "free" | "pro" | "bulk" | "forwarder";
  isDemo: boolean;
};

export const DEMO_USER: SessionUser = {
  id: "demo-user",
  email: "demo@sokoni.africa",
  name: "Amara Okonkwo",
  image: null,
  workspaceId: "demo-workspace",
  workspaceName: "Highlands Coffee Cooperative",
  plan: "pro",
  isDemo: true
};

// Returns the current user. Falls back to a demo user when auth isn't
// configured OR when the visitor isn't logged in — so dashboard pages always
// have something coherent to render.
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

    // Find or create a default workspace.
    const ws = await db
      .select()
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.userId, user.id))
      .limit(1);

    let workspaceId = ws[0]?.workspaceId;
    let workspaceName = user.name ?? user.email;
    let plan: SessionUser["plan"] = "free";

    if (workspaceId) {
      const wsRow = await db.select().from(schema.workspaces).where(eq(schema.workspaces.id, workspaceId)).limit(1);
      if (wsRow[0]) {
        workspaceName = wsRow[0].name;
        plan = (wsRow[0].plan as SessionUser["plan"]) ?? "free";
      }
    } else {
      const created = await db
        .insert(schema.workspaces)
        .values({ name: user.name ?? user.email, plan: "free" })
        .returning({ id: schema.workspaces.id, name: schema.workspaces.name });
      workspaceId = created[0].id;
      workspaceName = created[0].name;
      await db.insert(schema.workspaceMembers).values({
        workspaceId,
        userId: user.id,
        role: "owner"
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      workspaceId: workspaceId!,
      workspaceName,
      plan,
      isDemo: false
    };
  } catch (err) {
    console.warn("[session] error, falling back to demo:", err);
    return DEMO_USER;
  }
}
