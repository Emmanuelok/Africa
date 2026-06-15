"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, ShieldQuestion, CalendarClock, Webhook, Wand2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { agentIcon } from "./icons";
import { AgentDetail } from "./AgentDetail";
import { ApprovalCard } from "./ApprovalCard";
import type { Agent, AgentTemplate, Approval } from "./types";

function triggerBadge(t: AgentTemplate) {
  const kinds = t.triggers.map((x) => x.kind);
  if (kinds.includes("scheduled"))
    return (
      <Badge tone="info">
        <CalendarClock className="h-3 w-3" /> Scheduled
      </Badge>
    );
  if (kinds.includes("webhook"))
    return (
      <Badge tone="savanna">
        <Webhook className="h-3 w-3" /> Event-driven
      </Badge>
    );
  return (
    <Badge tone="terracotta">
      <Wand2 className="h-3 w-3" /> Manual
    </Badge>
  );
}

export function AgentsConsole({ canManage, isDemo }: { canManage: boolean; isDemo: boolean }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents ?? []);
      setTemplates(data.templates ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApprovals = useCallback(async () => {
    if (isDemo) return;
    try {
      const res = await fetch("/api/agents/approvals");
      const data = await res.json();
      setApprovals(data.approvals ?? []);
    } catch {
      /* ignore */
    }
  }, [isDemo]);

  useEffect(() => {
    load();
    loadApprovals();
  }, [load, loadApprovals]);

  async function addAgent(kind: string) {
    setCreating(kind);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind })
      });
      const data = await res.json();
      if (res.ok && data.agent) {
        await load();
        setShowCatalogue(false);
        setOpenId(data.agent.id);
      }
    } finally {
      setCreating(null);
    }
  }

  const openAgent = agents.find((a) => a.id === openId) ?? null;

  return (
    <div className="space-y-6">
      {/* Global pending approvals */}
      {!isDemo && approvals.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <ShieldQuestion className="h-4 w-4" />
            {approvals.length} {approvals.length === 1 ? "approval" : "approvals"} awaiting your decision
          </div>
          {approvals.slice(0, 3).map((a) => (
            <ApprovalCard
              key={a.id}
              approval={a}
              onResolved={() => {
                loadApprovals();
                load();
              }}
            />
          ))}
        </div>
      )}

      {/* Agent grid */}
      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading agents…
        </div>
      ) : agents.length === 0 ? (
        <EmptyState onAdd={() => setShowCatalogue(true)} canManage={canManage} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => {
            const Icon = agentIcon(a.template?.icon);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setOpenId(a.id)}
                className="group spotlight relative overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,15,14,0.04)] transition-all hover:-translate-y-0.5 hover:border-terracotta-300 hover:shadow-lg"
              >
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-terracotta-50 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
                <div className="relative flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta-500 to-terracotta-700 text-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  {a.enabled ? (
                    <span className="pulse-dot" title="Active" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-ink-300" title="Paused" />
                  )}
                </div>
                <h3 className="relative mt-3 font-display text-base font-semibold text-ink-900">{a.name}</h3>
                <p className="relative mt-1 line-clamp-2 text-sm text-ink-500">{a.description}</p>
                <div className="relative mt-3 flex flex-wrap gap-1.5">
                  {a.template && triggerBadge(a.template)}
                  {a.schedule && <span className="text-xs text-ink-400">next {fmtRel(a.nextRunAt)}</span>}
                </div>
              </button>
            );
          })}

          {canManage && (
            <button
              type="button"
              onClick={() => setShowCatalogue(true)}
              className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-sand-50/40 p-5 text-ink-500 transition-colors hover:border-terracotta-300 hover:text-terracotta-700"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add an agent</span>
            </button>
          )}
        </div>
      )}

      {/* Catalogue modal */}
      {showCatalogue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm" onClick={() => setShowCatalogue(false)} aria-label="Close" />
          <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-terracotta-600" />
              <h2 className="font-display text-xl font-semibold">Agent catalogue</h2>
            </div>
            <p className="mb-5 text-sm text-ink-500">
              Each agent automates part of your AfCFTA workflow. Add one, then configure its schedule, triggers,
              and approval policy.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => {
                const Icon = agentIcon(t.icon);
                return (
                  <div key={t.kind} className="flex flex-col rounded-xl border border-ink-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-terracotta-500 to-terracotta-700 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-tight">{t.name}</h3>
                        {triggerBadge(t)}
                      </div>
                    </div>
                    <p className="mt-2 flex-1 text-sm text-ink-600">{t.longDescription}</p>
                    <button
                      type="button"
                      disabled={creating === t.kind}
                      onClick={() => addAgent(t.kind)}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink-900 px-3 py-2 text-sm font-medium text-white hover:bg-ink-800 disabled:opacity-50"
                    >
                      {creating === t.kind ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Add to workspace
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {openAgent && (
        <AgentDetail
          agent={openAgent}
          isDemo={isDemo}
          canManage={canManage}
          approvals={approvals}
          onClose={() => setOpenId(null)}
          onChanged={load}
          onApprovalsChanged={loadApprovals}
        />
      )}
    </div>
  );
}

function fmtRel(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function EmptyState({ onAdd, canManage }: { onAdd: () => void; canManage: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-sand-50/40 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-terracotta-500 to-terracotta-700 text-white shadow-sm">
        <Wand2 className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold">Put your compliance on autopilot</h2>
      <p className="mt-1.5 max-w-md text-sm text-ink-500">
        Agents classify shipments, run Rules of Origin, watch for missed savings, and review every certificate —
        automatically, with you in the loop for anything that matters.
      </p>
      {canManage && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-700"
        >
          <Plus className="h-4 w-4" /> Add your first agent
        </button>
      )}
    </div>
  );
}
