"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Users2,
  Ship,
  GraduationCap,
  Sparkles,
  Loader2,
  Clock,
  Globe,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectView } from "./types";

function fmtRel(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function ProjectsConsole({ isDemo }: { isDemo: boolean }) {
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 text-xs">
          <span className="rounded-full bg-ink-100 px-2.5 py-1 font-medium text-ink-700">
            {projects.filter((p) => p.kind === "trade").length} trade rooms
          </span>
          <span className="rounded-full bg-savanna-50 px-2.5 py-1 font-medium text-savanna-700">
            {projects.filter((p) => p.kind === "study").length} study rooms
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
        >
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading projects…
        </div>
      ) : projects.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={load} isDemo={isDemo} />}
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectView }) {
  const isStudy = project.kind === "study";
  const accent = project.color || (isStudy ? "#1f7a4d" : "#b8401f");
  const Icon = isStudy ? GraduationCap : Ship;
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group spotlight relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,15,14,0.04)] transition-all hover:-translate-y-0.5 hover:border-terracotta-300 hover:shadow-lg"
    >
      {/* Accent wash */}
      <div
        aria-hidden
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-ink-500">
          {project.visibility === "link" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {project.visibility}
        </span>
      </div>
      <h3 className="relative mt-3 font-display text-base font-semibold text-ink-900">{project.name}</h3>
      {project.topic && <p className="relative mt-0.5 text-xs text-ink-500">{project.topic}</p>}
      {project.description && (
        <p className="relative mt-2 line-clamp-2 text-sm text-ink-600">{project.description}</p>
      )}
      <div className="relative mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1">
          <Users2 className="h-3 w-3" /> {project.memberCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {project.lastActivityAt ? fmtRel(project.lastActivityAt) : fmtRel(project.createdAt)}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-medium",
            project.role === "owner" ? "bg-terracotta-50 text-terracotta-700" : "bg-ink-100 text-ink-700"
          )}
        >
          {project.role}
        </span>
      </div>
    </Link>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FlavorCard
        onClick={onCreate}
        kind="trade"
        title="A trade room"
        body="Co-ordinate a shipment with your forwarder, the buyer, and the customs authority — share determinations and certificates without giving anyone access to your whole workspace."
        accent="#b8401f"
        Icon={Ship}
      />
      <FlavorCard
        onClick={onCreate}
        kind="study"
        title="A study room"
        body="Learn AfCFTA together. Invite friends with a shareable link — work through Rules of Origin, RVC maths, and HS classification side by side."
        accent="#1f7a4d"
        Icon={GraduationCap}
      />
    </div>
  );
}

function FlavorCard({
  onClick,
  title,
  body,
  accent,
  Icon
}: {
  onClick: () => void;
  kind: "trade" | "study";
  title: string;
  body: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-start overflow-hidden rounded-2xl border-2 border-dashed border-ink-200 bg-sand-50/40 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-solid hover:shadow-lg"
    >
      <div
        aria-hidden
        className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
        style={{ background: accent }}
      />
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="relative mt-3 font-display text-lg font-semibold">{title}</h3>
      <p className="relative mt-1.5 text-sm text-ink-600">{body}</p>
      <span className="relative mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-terracotta-700 group-hover:underline">
        <Sparkles className="h-3.5 w-3.5" /> Start one
      </span>
    </button>
  );
}

function CreateProjectModal({
  onClose,
  onCreated,
  isDemo
}: {
  onClose: () => void;
  onCreated: () => void;
  isDemo: boolean;
}) {
  const [kind, setKind] = useState<"trade" | "study">("trade");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "link">("link");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError("Give your project a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          name: name.trim(),
          topic: kind === "study" ? topic.trim() || undefined : undefined,
          description: description.trim() || undefined,
          visibility
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create project.");
        setBusy(false);
        return;
      }
      onCreated();
      onClose();
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="font-display text-xl font-semibold">New project</h2>
        <p className="mt-0.5 text-sm text-ink-500">Spin up a shared room. You can invite collaborators after.</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["trade", "study"] as const).map((k) => {
            const Icon = k === "study" ? GraduationCap : Ship;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition-all",
                  kind === k ? "border-terracotta-500 bg-terracotta-50/50" : "border-ink-200 hover:border-ink-300"
                )}
              >
                <Icon className={cn("h-5 w-5", kind === k ? "text-terracotta-700" : "text-ink-500")} />
                <div className="mt-1.5 text-sm font-semibold">{k === "trade" ? "Trade room" : "Study room"}</div>
                <div className="text-xs text-ink-500">{k === "trade" ? "Coordinate a shipment" : "Learn together"}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={kind === "study" ? "e.g. AfCFTA RoO study group" : "e.g. Mombasa → Lagos coffee shipment"}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-terracotta-400 focus:outline-none"
            />
          </Field>

          {kind === "study" && (
            <Field label="Topic">
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Rules of Origin & Regional Value Content"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-terracotta-400 focus:outline-none"
              />
            </Field>
          )}

          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this room for?"
              className="w-full resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-terracotta-400 focus:outline-none"
            />
          </Field>

          <Field label="Visibility">
            <div className="grid grid-cols-2 gap-2">
              {(["private", "link"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm",
                    visibility === v ? "border-terracotta-500 bg-terracotta-50/50" : "border-ink-200"
                  )}
                >
                  {v === "private" ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                  {v === "private" ? "Invite only" : "Shareable link"}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {isDemo && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Demo mode: projects you create here aren&apos;t persisted. Sign in to keep them.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-100">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create project
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-500">{label}</div>
      {children}
    </label>
  );
}
