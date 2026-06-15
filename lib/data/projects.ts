// Data layer for the collaboration engine: projects, project membership,
// shareable invites, and the collaborative feed. Every function degrades
// gracefully without a database (demo mode returns curated sample data; writes
// become no-ops returning synthetic ids).
//
// Access model: a user can see a project iff they have a project_members row.
// The creator is auto-added as the owner. Membership is project-scoped, so a
// collaborator from another organisation joins the project without joining the
// host workspace.

import { and, desc, eq, lt, sql, inArray, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getDb, schema } from "@/lib/db/client";

export type ProjectKind = "trade" | "study";
export type ProjectRole = "owner" | "editor" | "viewer";

export type ProjectView = {
  id: string;
  kind: ProjectKind;
  name: string;
  topic: string | null;
  description: string | null;
  visibility: "private" | "link";
  color: string | null;
  archivedAt: string | null;
  createdAt: string;
  memberCount: number;
  role: ProjectRole; // the viewer's role
  lastActivityAt: string | null;
};

export type ProjectMemberView = {
  id: string;
  userId: string;
  role: ProjectRole;
  displayName: string;
  email: string | null;
  organization: string | null;
  joinedVia: string;
  isSelf: boolean;
  createdAt: string;
};

export type ProjectEventView = {
  id: string;
  userId: string | null;
  authorName: string;
  kind: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  determinationId: string | null;
  certificateId: string | null;
  pinned: boolean;
  editedAt: string | null;
  createdAt: string;
  isSelf: boolean;
};

const ACCENTS = ["#b8401f", "#1f7a4d", "#b8841f", "#1f5a8a", "#7a1f6a", "#2f7a7a"];
function pickAccent(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

function iso(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  return (d instanceof Date ? d : new Date(d)).toISOString();
}

// ---------------------------------------------------------------------------
// Demo fixtures
// ---------------------------------------------------------------------------
export const DEMO_PROJECTS: ProjectView[] = [
  {
    id: "proj_demo_trade",
    kind: "trade",
    name: "Mombasa → Lagos coffee consignment",
    topic: null,
    description: "Co-ordinating the AfCFTA certificate for a 12-tonne green coffee shipment with our forwarder and the Lagos buyer.",
    visibility: "private",
    color: "#b8401f",
    archivedAt: null,
    createdAt: "2026-06-01T09:00:00Z",
    memberCount: 3,
    role: "owner",
    lastActivityAt: "2026-06-13T16:20:00Z"
  },
  {
    id: "proj_demo_study",
    kind: "study",
    name: "AfCFTA Rules of Origin — study group",
    topic: "Rules of Origin & Regional Value Content",
    description: "A small cohort working through RoO together — share worked examples, ask questions, learn the RVC maths.",
    visibility: "link",
    color: "#1f7a4d",
    archivedAt: null,
    createdAt: "2026-05-20T12:00:00Z",
    memberCount: 5,
    role: "owner",
    lastActivityAt: "2026-06-14T07:45:00Z"
  }
];

const DEMO_MEMBERS: Record<string, ProjectMemberView[]> = {
  proj_demo_trade: [
    { id: "pm1", userId: "demo-user", role: "owner", displayName: "Amara Okonkwo", email: "demo@sokoni.africa", organization: "Highlands Coffee Cooperative", joinedVia: "owner", isSelf: true, createdAt: "2026-06-01T09:00:00Z" },
    { id: "pm2", userId: "u-fwd", role: "editor", displayName: "Joseph Mwangi", email: "joseph@swiftforwarders.co.ke", organization: "Swift Forwarders Ltd", joinedVia: "email", isSelf: false, createdAt: "2026-06-01T10:30:00Z" },
    { id: "pm3", userId: "u-buyer", role: "viewer", displayName: "Chidi Eze", email: "chidi@lagosbeans.ng", organization: "Lagos Beans Imports", joinedVia: "link", isSelf: false, createdAt: "2026-06-02T08:00:00Z" }
  ],
  proj_demo_study: [
    { id: "pm4", userId: "demo-user", role: "owner", displayName: "Amara Okonkwo", email: "demo@sokoni.africa", organization: "Highlands Coffee Cooperative", joinedVia: "owner", isSelf: true, createdAt: "2026-05-20T12:00:00Z" },
    { id: "pm5", userId: "u-s1", role: "editor", displayName: "Fatima Bello", email: "fatima@student.edu.ng", organization: "Ahmadu Bello University", joinedVia: "link", isSelf: false, createdAt: "2026-05-21T09:00:00Z" },
    { id: "pm6", userId: "u-s2", role: "editor", displayName: "Thabo Nkosi", email: "thabo@student.ac.za", organization: "University of Cape Town", joinedVia: "link", isSelf: false, createdAt: "2026-05-22T14:00:00Z" }
  ]
};

const DEMO_EVENTS: Record<string, ProjectEventView[]> = {
  proj_demo_trade: [
    { id: "pe1", userId: "demo-user", authorName: "Amara Okonkwo", kind: "system", body: "created the project", metadata: null, determinationId: null, certificateId: null, pinned: false, editedAt: null, createdAt: "2026-06-01T09:00:00Z", isSelf: true },
    { id: "pe2", userId: "demo-user", authorName: "Amara Okonkwo", kind: "message", body: "Welcome both — let's get the certificate sorted before the vessel books on the 18th. I've run the determination, it qualifies under wholly-obtained.", metadata: null, determinationId: null, certificateId: null, pinned: true, editedAt: null, createdAt: "2026-06-01T10:35:00Z", isSelf: true },
    { id: "pe3", userId: "u-fwd", authorName: "Joseph Mwangi", kind: "message", body: "Great. Can you share the FOB breakdown so I can finalise the commercial invoice?", metadata: null, determinationId: null, certificateId: null, pinned: false, editedAt: null, createdAt: "2026-06-13T16:20:00Z", isSelf: false }
  ],
  proj_demo_study: [
    { id: "pe4", userId: "u-s1", authorName: "Fatima Bello", kind: "question", body: "If a good has 35% non-originating inputs by value, does it meet the 40% RVC threshold under the build-down method?", metadata: null, determinationId: null, certificateId: null, pinned: false, editedAt: null, createdAt: "2026-06-14T07:30:00Z", isSelf: false },
    { id: "pe5", userId: "demo-user", authorName: "Amara Okonkwo", kind: "answer", body: "Build-down: RVC = (FOB − VNM) / FOB. With 35% non-originating, RVC = 65% — comfortably above 40%. It qualifies.", metadata: null, determinationId: null, certificateId: null, pinned: true, editedAt: null, createdAt: "2026-06-14T07:45:00Z", isSelf: true }
  ]
};

export function isDemoProjectId(id: string): boolean {
  return id.startsWith("proj_demo_");
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export async function listProjectsForUser(userId: string, isDemo: boolean): Promise<ProjectView[]> {
  const db = getDb();
  if (!db || isDemo) return DEMO_PROJECTS;

  const memberships = await db
    .select({ projectId: schema.projectMembers.projectId, role: schema.projectMembers.role })
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.userId, userId));
  if (memberships.length === 0) return [];

  const ids = memberships.map((m) => m.projectId);
  const rows = await db.select().from(schema.projects).where(inArray(schema.projects.id, ids)).orderBy(desc(schema.projects.updatedAt));

  // Member counts + last activity in two grouped queries.
  const counts = await db
    .select({ projectId: schema.projectMembers.projectId, n: sql<number>`count(*)::int` })
    .from(schema.projectMembers)
    .where(inArray(schema.projectMembers.projectId, ids))
    .groupBy(schema.projectMembers.projectId);
  const countMap = new Map(counts.map((c) => [c.projectId, c.n]));

  const last = await db
    .select({ projectId: schema.projectEvents.projectId, at: sql<string>`max(${schema.projectEvents.createdAt})` })
    .from(schema.projectEvents)
    .where(inArray(schema.projectEvents.projectId, ids))
    .groupBy(schema.projectEvents.projectId);
  const lastMap = new Map(last.map((l) => [l.projectId, l.at]));

  const roleMap = new Map(memberships.map((m) => [m.projectId, m.role as ProjectRole]));

  return rows.map((p) => ({
    id: p.id,
    kind: (p.kind as ProjectKind) ?? "trade",
    name: p.name,
    topic: p.topic,
    description: p.description,
    visibility: (p.visibility as "private" | "link") ?? "private",
    color: p.color,
    archivedAt: iso(p.archivedAt),
    createdAt: iso(p.createdAt)!,
    memberCount: countMap.get(p.id) ?? 1,
    role: roleMap.get(p.id) ?? "viewer",
    lastActivityAt: lastMap.get(p.id) ? iso(lastMap.get(p.id)!) : null
  }));
}

export type CreateProjectInput = {
  workspaceId: string;
  kind: ProjectKind;
  name: string;
  topic?: string | null;
  description?: string | null;
  visibility?: "private" | "link";
  user: { id: string; name: string | null; email: string; organization?: string | null };
};

export async function createProject(input: CreateProjectInput): Promise<ProjectView> {
  const db = getDb();
  const color = pickAccent(input.name);
  if (!db || input.user.id === "demo-user") {
    return {
      id: `proj_demo_${randomBytes(4).toString("hex")}`,
      kind: input.kind,
      name: input.name,
      topic: input.topic ?? null,
      description: input.description ?? null,
      visibility: input.visibility ?? "private",
      color,
      archivedAt: null,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      role: "owner",
      lastActivityAt: null
    };
  }

  const rows = await db
    .insert(schema.projects)
    .values({
      workspaceId: input.workspaceId,
      kind: input.kind,
      name: input.name,
      topic: input.topic ?? null,
      description: input.description ?? null,
      visibility: input.visibility ?? "private",
      color,
      createdById: input.user.id
    })
    .returning();
  const p = rows[0];

  await db.insert(schema.projectMembers).values({
    projectId: p.id,
    userId: input.user.id,
    role: "owner",
    displayName: input.user.name ?? input.user.email,
    email: input.user.email,
    organization: input.user.organization ?? null,
    joinedVia: "owner"
  });

  await db.insert(schema.projectEvents).values({
    projectId: p.id,
    userId: input.user.id,
    authorName: input.user.name ?? input.user.email,
    kind: "system",
    body: "created the project"
  });

  return {
    id: p.id,
    kind: input.kind,
    name: p.name,
    topic: p.topic,
    description: p.description,
    visibility: (p.visibility as "private" | "link") ?? "private",
    color: p.color,
    archivedAt: null,
    createdAt: iso(p.createdAt)!,
    memberCount: 1,
    role: "owner",
    lastActivityAt: null
  };
}

// Returns the project + the viewer's role, or null if the user has no access.
export async function getProjectForUser(
  projectId: string,
  userId: string,
  isDemo: boolean
): Promise<{ project: ProjectView; role: ProjectRole } | null> {
  if (!getDb() || isDemo || isDemoProjectId(projectId)) {
    const demo = DEMO_PROJECTS.find((p) => p.id === projectId);
    return demo ? { project: demo, role: demo.role } : null;
  }
  const db = getDb()!;
  const memberRows = await db
    .select()
    .from(schema.projectMembers)
    .where(and(eq(schema.projectMembers.projectId, projectId), eq(schema.projectMembers.userId, userId)))
    .limit(1);
  if (!memberRows[0]) return null;

  const rows = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId)).limit(1);
  const p = rows[0];
  if (!p) return null;

  const cnt = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.projectId, projectId));

  const role = memberRows[0].role as ProjectRole;
  return {
    role,
    project: {
      id: p.id,
      kind: (p.kind as ProjectKind) ?? "trade",
      name: p.name,
      topic: p.topic,
      description: p.description,
      visibility: (p.visibility as "private" | "link") ?? "private",
      color: p.color,
      archivedAt: iso(p.archivedAt),
      createdAt: iso(p.createdAt)!,
      memberCount: cnt[0]?.n ?? 1,
      role,
      lastActivityAt: null
    }
  };
}

export async function getMembership(projectId: string, userId: string): Promise<ProjectRole | null> {
  const db = getDb();
  if (!db) return isDemoProjectId(projectId) && userId === "demo-user" ? "owner" : null;
  const rows = await db
    .select({ role: schema.projectMembers.role })
    .from(schema.projectMembers)
    .where(and(eq(schema.projectMembers.projectId, projectId), eq(schema.projectMembers.userId, userId)))
    .limit(1);
  return (rows[0]?.role as ProjectRole) ?? null;
}

export async function updateProject(
  projectId: string,
  patch: { name?: string; topic?: string | null; description?: string | null; visibility?: "private" | "link"; archived?: boolean }
): Promise<void> {
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) return;
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.topic !== undefined) set.topic = patch.topic;
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.visibility !== undefined) set.visibility = patch.visibility;
  if (patch.archived !== undefined) set.archivedAt = patch.archived ? new Date() : null;
  await db.update(schema.projects).set(set).where(eq(schema.projects.id, projectId));
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------
export async function listMembers(projectId: string, viewerUserId: string): Promise<ProjectMemberView[]> {
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) {
    return (DEMO_MEMBERS[projectId] ?? []).map((m) => ({ ...m, isSelf: m.userId === viewerUserId }));
  }
  const rows = await db
    .select()
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.projectId, projectId))
    .orderBy(schema.projectMembers.createdAt);
  return rows.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role as ProjectRole,
    displayName: m.displayName ?? m.email ?? "Member",
    email: m.email,
    organization: m.organization,
    joinedVia: m.joinedVia,
    isSelf: m.userId === viewerUserId,
    createdAt: iso(m.createdAt)!
  }));
}

export async function addMember(
  projectId: string,
  user: { id: string; name: string | null; email: string; organization?: string | null },
  role: ProjectRole,
  joinedVia: string
): Promise<{ added: boolean }> {
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) return { added: true };
  const existing = await db
    .select({ id: schema.projectMembers.id })
    .from(schema.projectMembers)
    .where(and(eq(schema.projectMembers.projectId, projectId), eq(schema.projectMembers.userId, user.id)))
    .limit(1);
  if (existing[0]) return { added: false };

  await db.insert(schema.projectMembers).values({
    projectId,
    userId: user.id,
    role,
    displayName: user.name ?? user.email,
    email: user.email,
    organization: user.organization ?? null,
    joinedVia
  });
  await db.insert(schema.projectEvents).values({
    projectId,
    userId: user.id,
    authorName: user.name ?? user.email,
    kind: "system",
    body: `joined via ${joinedVia}`
  });
  return { added: true };
}

export async function setMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<void> {
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) return;
  await db
    .update(schema.projectMembers)
    .set({ role })
    .where(and(eq(schema.projectMembers.projectId, projectId), eq(schema.projectMembers.userId, userId)));
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) return;
  await db
    .delete(schema.projectMembers)
    .where(and(eq(schema.projectMembers.projectId, projectId), eq(schema.projectMembers.userId, userId)));
}

// ---------------------------------------------------------------------------
// Invites (shareable links)
// ---------------------------------------------------------------------------
export type InviteView = {
  id: string;
  token: string;
  role: ProjectRole;
  email: string | null;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export function inviteToken(): string {
  return randomBytes(18).toString("base64url");
}

export async function createInvite(
  projectId: string,
  opts: { role: ProjectRole; email?: string | null; maxUses?: number | null; expiresInDays?: number | null; createdById: string }
): Promise<InviteView> {
  const token = inviteToken();
  const expiresAt = opts.expiresInDays ? new Date(Date.now() + opts.expiresInDays * 86400_000) : null;
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) {
    return {
      id: `inv_demo_${randomBytes(4).toString("hex")}`,
      token,
      role: opts.role,
      email: opts.email ?? null,
      maxUses: opts.maxUses ?? null,
      uses: 0,
      expiresAt: iso(expiresAt),
      revokedAt: null,
      createdAt: new Date().toISOString()
    };
  }
  const rows = await db
    .insert(schema.projectInvites)
    .values({
      projectId,
      token,
      role: opts.role,
      email: opts.email ?? null,
      maxUses: opts.maxUses ?? null,
      expiresAt,
      createdById: opts.createdById
    })
    .returning();
  const r = rows[0];
  return {
    id: r.id,
    token: r.token,
    role: r.role as ProjectRole,
    email: r.email,
    maxUses: r.maxUses,
    uses: r.uses,
    expiresAt: iso(r.expiresAt),
    revokedAt: iso(r.revokedAt),
    createdAt: iso(r.createdAt)!
  };
}

export async function listInvites(projectId: string): Promise<InviteView[]> {
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) {
    return [
      { id: "inv_demo_link", token: "demo-shareable-link-token", role: "editor", email: null, maxUses: null, uses: 2, expiresAt: null, revokedAt: null, createdAt: "2026-05-20T12:05:00Z" }
    ];
  }
  const rows = await db
    .select()
    .from(schema.projectInvites)
    .where(and(eq(schema.projectInvites.projectId, projectId), isNull(schema.projectInvites.revokedAt)))
    .orderBy(desc(schema.projectInvites.createdAt));
  return rows.map((r) => ({
    id: r.id,
    token: r.token,
    role: r.role as ProjectRole,
    email: r.email,
    maxUses: r.maxUses,
    uses: r.uses,
    expiresAt: iso(r.expiresAt),
    revokedAt: iso(r.revokedAt),
    createdAt: iso(r.createdAt)!
  }));
}

export async function revokeInvite(projectId: string, inviteId: string): Promise<void> {
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) return;
  await db
    .update(schema.projectInvites)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.projectInvites.id, inviteId), eq(schema.projectInvites.projectId, projectId)));
}

export type InvitePreview = {
  valid: boolean;
  reason?: string;
  project?: { id: string; name: string; kind: ProjectKind; topic: string | null; description: string | null; memberCount: number; color: string | null };
  inviterName?: string | null;
  role?: ProjectRole;
};

// Public preview for /join/<token> — no auth required.
export async function previewInvite(token: string): Promise<InvitePreview> {
  const db = getDb();
  if (!db) {
    if (token === "demo-shareable-link-token") {
      const p = DEMO_PROJECTS[1];
      return { valid: true, project: { id: p.id, name: p.name, kind: p.kind, topic: p.topic, description: p.description, memberCount: p.memberCount, color: p.color }, inviterName: "Amara Okonkwo", role: "editor" };
    }
    return { valid: false, reason: "Sign-in and a database are required to use invite links." };
  }
  const rows = await db.select().from(schema.projectInvites).where(eq(schema.projectInvites.token, token)).limit(1);
  const inv = rows[0];
  if (!inv) return { valid: false, reason: "This invite link is invalid." };
  if (inv.revokedAt) return { valid: false, reason: "This invite link has been revoked." };
  if (inv.expiresAt && inv.expiresAt < new Date()) return { valid: false, reason: "This invite link has expired." };
  if (inv.maxUses != null && inv.uses >= inv.maxUses) return { valid: false, reason: "This invite link has reached its use limit." };

  const pRows = await db.select().from(schema.projects).where(eq(schema.projects.id, inv.projectId)).limit(1);
  const p = pRows[0];
  if (!p) return { valid: false, reason: "The project no longer exists." };

  const cnt = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.projectMembers)
    .where(eq(schema.projectMembers.projectId, p.id));

  let inviterName: string | null = null;
  if (inv.createdById) {
    const u = await db.select({ name: schema.users.name, email: schema.users.email }).from(schema.users).where(eq(schema.users.id, inv.createdById)).limit(1);
    inviterName = u[0]?.name ?? u[0]?.email ?? null;
  }

  return {
    valid: true,
    role: inv.role as ProjectRole,
    inviterName,
    project: { id: p.id, name: p.name, kind: (p.kind as ProjectKind) ?? "trade", topic: p.topic, description: p.description, memberCount: cnt[0]?.n ?? 1, color: p.color }
  };
}

export type RedeemResult = { ok: true; projectId: string; already: boolean } | { ok: false; reason: string };

export async function redeemInvite(
  token: string,
  user: { id: string; name: string | null; email: string; organization?: string | null }
): Promise<RedeemResult> {
  const db = getDb();
  if (!db) return { ok: false, reason: "A database is required to join projects." };

  const rows = await db.select().from(schema.projectInvites).where(eq(schema.projectInvites.token, token)).limit(1);
  const inv = rows[0];
  if (!inv) return { ok: false, reason: "This invite link is invalid." };
  if (inv.revokedAt) return { ok: false, reason: "This invite link has been revoked." };
  if (inv.expiresAt && inv.expiresAt < new Date()) return { ok: false, reason: "This invite link has expired." };
  if (inv.maxUses != null && inv.uses >= inv.maxUses) return { ok: false, reason: "This invite link has reached its use limit." };

  const result = await addMember(inv.projectId, user, inv.role as ProjectRole, "link");
  if (result.added) {
    await db
      .update(schema.projectInvites)
      .set({ uses: inv.uses + 1 })
      .where(eq(schema.projectInvites.id, inv.id));
  }
  return { ok: true, projectId: inv.projectId, already: !result.added };
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------
export async function listEvents(
  projectId: string,
  viewerUserId: string,
  opts?: { limit?: number; before?: string }
): Promise<ProjectEventView[]> {
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) {
    return (DEMO_EVENTS[projectId] ?? []).map((e) => ({ ...e, isSelf: e.userId === viewerUserId }));
  }
  const conds = [eq(schema.projectEvents.projectId, projectId), isNull(schema.projectEvents.deletedAt)];
  if (opts?.before) conds.push(lt(schema.projectEvents.createdAt, new Date(opts.before)));
  const rows = await db
    .select()
    .from(schema.projectEvents)
    .where(and(...conds))
    .orderBy(desc(schema.projectEvents.createdAt))
    .limit(opts?.limit ?? 100);
  // Return chronological (oldest first) for the timeline.
  return rows
    .map((e) => ({
      id: e.id,
      userId: e.userId,
      authorName: e.authorName ?? "Member",
      kind: e.kind,
      body: e.body,
      metadata: e.metadata,
      determinationId: e.determinationId,
      certificateId: e.certificateId,
      pinned: e.pinned,
      editedAt: iso(e.editedAt),
      createdAt: iso(e.createdAt)!,
      isSelf: e.userId === viewerUserId
    }))
    .reverse();
}

export type PostEventInput = {
  projectId: string;
  user: { id: string; name: string | null; email: string };
  kind: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  determinationId?: string | null;
  certificateId?: string | null;
};

export async function postEvent(input: PostEventInput): Promise<ProjectEventView> {
  const db = getDb();
  const authorName = input.user.name ?? input.user.email;
  if (!db || isDemoProjectId(input.projectId)) {
    return {
      id: `pe_demo_${randomBytes(4).toString("hex")}`,
      userId: input.user.id,
      authorName,
      kind: input.kind,
      body: input.body ?? null,
      metadata: input.metadata ?? null,
      determinationId: input.determinationId ?? null,
      certificateId: input.certificateId ?? null,
      pinned: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      isSelf: true
    };
  }
  const rows = await db
    .insert(schema.projectEvents)
    .values({
      projectId: input.projectId,
      userId: input.user.id,
      authorName,
      kind: input.kind,
      body: input.body ?? null,
      metadata: input.metadata ?? null,
      determinationId: input.determinationId ?? null,
      certificateId: input.certificateId ?? null
    })
    .returning();
  // Touch the project so it sorts to the top of the list.
  await db.update(schema.projects).set({ updatedAt: new Date() }).where(eq(schema.projects.id, input.projectId));
  const e = rows[0];
  return {
    id: e.id,
    userId: e.userId,
    authorName: e.authorName ?? authorName,
    kind: e.kind,
    body: e.body,
    metadata: e.metadata,
    determinationId: e.determinationId,
    certificateId: e.certificateId,
    pinned: e.pinned,
    editedAt: iso(e.editedAt),
    createdAt: iso(e.createdAt)!,
    isSelf: true
  };
}

export async function setEventPinned(projectId: string, eventId: string, pinned: boolean): Promise<void> {
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) return;
  await db
    .update(schema.projectEvents)
    .set({ pinned })
    .where(and(eq(schema.projectEvents.id, eventId), eq(schema.projectEvents.projectId, projectId)));
}

export async function deleteEvent(projectId: string, eventId: string, userId: string): Promise<void> {
  const db = getDb();
  if (!db || isDemoProjectId(projectId)) return;
  await db
    .update(schema.projectEvents)
    .set({ deletedAt: new Date() })
    .where(and(eq(schema.projectEvents.id, eventId), eq(schema.projectEvents.projectId, projectId), eq(schema.projectEvents.userId, userId)));
}
