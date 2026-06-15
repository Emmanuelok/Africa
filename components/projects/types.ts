export type ProjectView = {
  id: string;
  kind: "trade" | "study";
  name: string;
  topic: string | null;
  description: string | null;
  visibility: "private" | "link";
  color: string | null;
  archivedAt: string | null;
  createdAt: string;
  memberCount: number;
  role: "owner" | "editor" | "viewer";
  lastActivityAt: string | null;
};

export type ProjectMemberView = {
  id: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
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

export type InviteView = {
  id: string;
  token: string;
  url: string;
  role: "editor" | "viewer";
  email: string | null;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  createdAt: string;
};

export type Viewer = { id: string; name: string; isDemo: boolean };
