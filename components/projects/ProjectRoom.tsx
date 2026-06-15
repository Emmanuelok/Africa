"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Loader2,
  Users2,
  Link2,
  Copy,
  Check,
  Trash2,
  Settings2,
  GraduationCap,
  Ship,
  HelpCircle,
  MessageSquare,
  StickyNote,
  Sparkles,
  Plus,
  Globe,
  Lock,
  CircleUserRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InviteView, ProjectEventView, ProjectMemberView, ProjectView, Viewer } from "./types";

const KINDS = [
  { kind: "message", label: "Message", icon: MessageSquare },
  { kind: "note", label: "Note", icon: StickyNote },
  { kind: "question", label: "Question", icon: HelpCircle },
  { kind: "answer", label: "Answer", icon: Sparkles }
] as const;

const KIND_TONE: Record<string, string> = {
  message: "bg-white",
  note: "bg-amber-50/60 border-amber-200",
  question: "bg-blue-50/60 border-blue-200",
  answer: "bg-green-50/60 border-green-200",
  system: "bg-ink-50/60 text-ink-500 italic"
};

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function colorFor(seed: string): string {
  const palette = ["#b8401f", "#1f7a4d", "#1f5a8a", "#b8841f", "#7a1f6a", "#2f7a7a"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function ProjectRoom({
  project: initialProject,
  members: initialMembers,
  events: initialEvents,
  invites: initialInvites,
  viewer,
  canManage
}: {
  project: ProjectView;
  members: ProjectMemberView[];
  events: ProjectEventView[];
  invites: InviteView[];
  viewer: Viewer;
  canManage: boolean;
}) {
  const isStudy = initialProject.kind === "study";
  const accent = initialProject.color || (isStudy ? "#1f7a4d" : "#b8401f");

  const [members, setMembers] = useState(initialMembers);
  const [events, setEvents] = useState(initialEvents);
  const [invites, setInvites] = useState(initialInvites);
  const [tab, setTab] = useState<"feed" | "members" | "share">("feed");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]["kind"]>("message");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const feedRef = useRef<HTMLDivElement>(null);
  const canPost = !viewer.isDemo ? true : true; // demo mode echoes locally

  // Lightweight polling for near-live collaboration. 6s is gentle on the DB.
  useEffect(() => {
    if (viewer.isDemo) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${initialProject.id}/events`);
        const data = await res.json();
        if (Array.isArray(data.events)) setEvents(data.events);
      } catch {
        /* ignore */
      }
    }, 6000);
    return () => clearInterval(t);
  }, [initialProject.id, viewer.isDemo]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [events.length]);

  const post = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    setPostError(null);

    // Optimistic insertion.
    const tempId = `tmp_${Date.now()}`;
    const tempEvent: ProjectEventView = {
      id: tempId,
      userId: viewer.id,
      authorName: viewer.name,
      kind,
      body: trimmed,
      metadata: null,
      determinationId: null,
      certificateId: null,
      pinned: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      isSelf: true
    };
    setEvents((prev) => [...prev, tempEvent]);
    setBody("");

    try {
      const res = await fetch(`/api/projects/${initialProject.id}/events`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, body: trimmed })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPostError(data.error || "Could not post.");
        setEvents((prev) => prev.filter((e) => e.id !== tempId));
      } else {
        setEvents((prev) => prev.map((e) => (e.id === tempId ? data.event : e)));
      }
    } catch {
      setPostError("Network error.");
      setEvents((prev) => prev.filter((e) => e.id !== tempId));
    } finally {
      setPosting(false);
    }
  }, [body, kind, initialProject.id, posting, viewer.id, viewer.name]);

  async function leave() {
    if (!confirm(`Leave "${initialProject.name}"?`)) return;
    await fetch(`/api/projects/${initialProject.id}/members`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: viewer.id })
    });
    window.location.href = "/dashboard/projects";
  }

  async function reloadInvites() {
    const res = await fetch(`/api/projects/${initialProject.id}/invites`);
    const data = await res.json();
    setInvites(data.invites ?? []);
  }

  async function reloadMembers() {
    const res = await fetch(`/api/projects/${initialProject.id}`);
    const data = await res.json();
    setMembers(data.members ?? []);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        {/* Header */}
        <header
          className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${accent}08, white 40%)` }}
        >
          <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900">
            <ArrowLeft className="h-3 w-3" /> All projects
          </Link>
          <div className="mt-2 flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
            >
              {isStudy ? <GraduationCap className="h-6 w-6" /> : <Ship className="h-6 w-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-semibold leading-tight">{initialProject.name}</h1>
              {initialProject.topic && <p className="mt-0.5 text-sm text-ink-600">{initialProject.topic}</p>}
              {initialProject.description && (
                <p className="mt-2 text-sm text-ink-600">{initialProject.description}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Users2 className="h-3.5 w-3.5" /> {members.length} members
                </span>
                <span className="inline-flex items-center gap-1">
                  {initialProject.visibility === "link" ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  {initialProject.visibility}
                </span>
                <span className="rounded-full bg-ink-100 px-2 py-0.5 font-medium">
                  You are {initialProject.role}
                </span>
              </div>
            </div>
            {!canManage && (
              <button
                type="button"
                onClick={leave}
                className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs text-ink-700 hover:bg-ink-50"
              >
                Leave
              </button>
            )}
          </div>
        </header>

        {/* Tab strip (mobile-only — desktop uses the side rail) */}
        <div className="flex gap-1 rounded-xl border border-ink-200 bg-white p-1 lg:hidden">
          {(["feed", "members", "share"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium capitalize",
                tab === t ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Feed */}
        {(tab === "feed" || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
          <div className="rounded-2xl border border-ink-200 bg-white shadow-sm lg:block" style={{ display: tab === "feed" ? "block" : "" }}>
            <div ref={feedRef} className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
              {events.length === 0 ? (
                <div className="py-8 text-center text-sm text-ink-500">No activity yet. Say hi.</div>
              ) : (
                events.map((e) => <EventRow key={e.id} event={e} accent={accent} />)
              )}
            </div>

            <div className="border-t border-ink-100 p-4">
              <div className="mb-2 flex flex-wrap gap-1">
                {KINDS.map(({ kind: k, label, icon: Icon }) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      kind === k ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 text-ink-600 hover:bg-ink-50"
                    )}
                  >
                    <Icon className="h-3 w-3" /> {label}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      post();
                    }
                  }}
                  rows={2}
                  placeholder={
                    kind === "question"
                      ? "Ask the group a question (⌘↵ to send)"
                      : kind === "answer"
                        ? "Share what you found out (⌘↵ to send)"
                        : kind === "note"
                          ? "Drop a note for the room (⌘↵ to send)"
                          : "Write a message (⌘↵ to send)"
                  }
                  disabled={!canPost}
                  className="min-h-[44px] flex-1 resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-terracotta-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={post}
                  disabled={!canPost || posting || !body.trim()}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-terracotta-600 px-3 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
                >
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              {postError && <p className="mt-1.5 text-xs text-red-600">{postError}</p>}
            </div>
          </div>
        )}

        {/* Mobile members tab */}
        {tab === "members" && (
          <div className="rounded-2xl border border-ink-200 bg-white p-4 lg:hidden">
            <MembersList members={members} viewerId={viewer.id} canManage={canManage} projectId={initialProject.id} onChanged={reloadMembers} />
          </div>
        )}
        {tab === "share" && (
          <div className="rounded-2xl border border-ink-200 bg-white p-4 lg:hidden">
            <ShareCard
              projectId={initialProject.id}
              canManage={canManage}
              invites={invites}
              onChanged={reloadInvites}
              isDemo={viewer.isDemo}
            />
          </div>
        )}
      </div>

      {/* Desktop side rail */}
      <aside className="hidden space-y-4 lg:block">
        <div className="rounded-2xl border border-ink-200 bg-white p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Users2 className="h-4 w-4" /> Members
          </h2>
          <MembersList members={members} viewerId={viewer.id} canManage={canManage} projectId={initialProject.id} onChanged={reloadMembers} />
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <Link2 className="h-4 w-4" /> Invite a friend
          </h2>
          <ShareCard
            projectId={initialProject.id}
            canManage={canManage}
            invites={invites}
            onChanged={reloadInvites}
            isDemo={viewer.isDemo}
          />
        </div>
      </aside>
    </div>
  );
}

function EventRow({ event, accent }: { event: ProjectEventView; accent: string }) {
  if (event.kind === "system") {
    return (
      <div className="px-2 text-center text-xs italic text-ink-500">
        {event.authorName} {event.body ?? "did something"} · {relTime(event.createdAt)}
      </div>
    );
  }
  const tone = KIND_TONE[event.kind] ?? "bg-white";
  const Icon =
    event.kind === "question"
      ? HelpCircle
      : event.kind === "answer"
        ? Sparkles
        : event.kind === "note"
          ? StickyNote
          : MessageSquare;
  return (
    <div className={cn("flex gap-3 rounded-xl border border-ink-200 p-3", tone)}>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ background: colorFor(event.authorName) }}
      >
        {initials(event.authorName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-xs">
          <span className="font-semibold text-ink-900">{event.authorName}</span>
          {event.kind !== "message" && (
            <span className="inline-flex items-center gap-0.5 text-ink-500">
              <Icon className="h-3 w-3" /> {event.kind}
            </span>
          )}
          {event.pinned && <span className="text-amber-600">📌</span>}
          <span className="ml-auto text-ink-400">{relTime(event.createdAt)}</span>
        </div>
        <div className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-800">{event.body}</div>
      </div>
    </div>
  );
}

function MembersList({
  members,
  viewerId,
  canManage,
  projectId,
  onChanged
}: {
  members: ProjectMemberView[];
  viewerId: string;
  canManage: boolean;
  projectId: string;
  onChanged: () => void;
}) {
  async function setRole(userId: string, role: "owner" | "editor" | "viewer") {
    await fetch(`/api/projects/${projectId}/members`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, role })
    });
    onChanged();
  }
  async function remove(userId: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/projects/${projectId}/members`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId })
    });
    onChanged();
  }
  return (
    <ul className="space-y-2">
      {members.map((m) => (
        <li key={m.id} className="flex items-center gap-2 text-sm">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ background: colorFor(m.displayName) }}
          >
            {initials(m.displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-ink-900">
              {m.displayName}
              {m.isSelf && <span className="ml-1 text-xs text-ink-400">(you)</span>}
            </div>
            {m.organization && <div className="truncate text-xs text-ink-500">{m.organization}</div>}
          </div>
          {canManage && !m.isSelf ? (
            <select
              value={m.role}
              onChange={(e) => setRole(m.userId, e.target.value as "owner" | "editor" | "viewer")}
              className="rounded-md border border-ink-200 bg-white px-1.5 py-0.5 text-xs"
            >
              <option value="viewer">viewer</option>
              <option value="editor">editor</option>
              <option value="owner">owner</option>
            </select>
          ) : (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700">{m.role}</span>
          )}
          {canManage && !m.isSelf && (
            <button
              type="button"
              onClick={() => remove(m.userId)}
              className="rounded-md p-1 text-ink-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Remove member"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function ShareCard({
  projectId,
  canManage,
  invites,
  onChanged,
  isDemo
}: {
  projectId: string;
  canManage: boolean;
  invites: InviteView[];
  onChanged: () => void;
  isDemo: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [copied, setCopied] = useState<string | null>(null);

  async function mint() {
    setCreating(true);
    try {
      await fetch(`/api/projects/${projectId}/invites`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role })
      });
      onChanged();
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this link? Anyone holding it can no longer join.")) return;
    await fetch(`/api/projects/${projectId}/invites/${id}`, { method: "DELETE" });
    onChanged();
  }

  function copy(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  if (!canManage) {
    return (
      <p className="text-xs text-ink-500">
        Only the project owner can mint invite links. Ask them to share one with you.
      </p>
    );
  }

  return (
    <div>
      {invites.length === 0 ? (
        <p className="text-xs text-ink-500">
          No active invites yet. Mint a shareable link below — anyone with it can join as {role}.
        </p>
      ) : (
        <ul className="mb-3 space-y-2">
          {invites.map((i) => (
            <li key={i.id} className="rounded-lg border border-ink-200 bg-sand-50/40 p-2">
              <div className="flex items-center gap-1.5 text-xs text-ink-500">
                <CircleUserRound className="h-3 w-3" />
                <span className="font-medium uppercase tracking-wide">{i.role}</span>
                <span>· {i.uses} {i.uses === 1 ? "use" : "uses"}{i.maxUses ? ` / ${i.maxUses}` : ""}</span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <code className="min-w-0 flex-1 truncate rounded bg-white px-1.5 py-0.5 text-[10px]">{i.url}</code>
                <button
                  type="button"
                  onClick={() => copy(i.url, i.id)}
                  className="rounded p-1 text-ink-500 hover:bg-white hover:text-ink-900"
                  aria-label="Copy link"
                >
                  {copied === i.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => revoke(i.id)}
                  className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Revoke link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
          className="rounded-md border border-ink-200 bg-white px-2 py-1 text-xs"
        >
          <option value="editor">editor</option>
          <option value="viewer">viewer</option>
        </select>
        <button
          type="button"
          onClick={mint}
          disabled={creating}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-ink-800 disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          New link
        </button>
      </div>

      {isDemo && (
        <p className="mt-2 text-[10px] text-amber-700">
          Demo mode: links aren&apos;t persisted. Sign in to share real invites.
        </p>
      )}
    </div>
  );
}
