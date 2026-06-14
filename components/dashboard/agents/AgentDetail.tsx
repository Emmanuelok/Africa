"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  Play,
  Loader2,
  Clock,
  Zap,
  Trash2,
  Power,
  CalendarClock,
  Webhook,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { agentIcon } from "./icons";
import { RunTrace } from "./RunTrace";
import { ApprovalCard } from "./ApprovalCard";
import type { Agent, Approval, RunSummary, Step } from "./types";

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const RUN_STATUS_TONE: Record<string, "neutral" | "info" | "warn" | "success" | "terracotta"> = {
  queued: "neutral",
  running: "info",
  awaiting_approval: "warn",
  succeeded: "success",
  failed: "terracotta",
  cancelled: "neutral"
};

export function AgentDetail({
  agent,
  isDemo,
  canManage,
  approvals,
  onClose,
  onChanged,
  onApprovalsChanged
}: {
  agent: Agent;
  isDemo: boolean;
  canManage: boolean;
  approvals: Approval[];
  onClose: () => void;
  onChanged: () => void;
  onApprovalsChanged: () => void;
}) {
  const Icon = agentIcon(agent.template?.icon);
  const isManual = agent.template?.triggers.some((t) => t.kind === "manual") ?? true;
  const isScheduled = !!agent.schedule;
  const isWebhook = !!agent.eventTrigger;

  const [goal, setGoal] = useState("");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<RunSummary | null>(null);
  const [activeSteps, setActiveSteps] = useState<Step[]>([]);
  const [history, setHistory] = useState<RunSummary[]>([]);

  const loadHistory = useCallback(async () => {
    if (isDemo) return;
    try {
      const res = await fetch(`/api/agents/${agent.id}`);
      const data = await res.json();
      if (Array.isArray(data.runs)) setHistory(data.runs);
    } catch {
      /* ignore */
    }
  }, [agent.id, isDemo]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function runNow() {
    setRunning(true);
    setRunError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal: goal.trim() || undefined })
      });
      const data = await res.json();
      if (data.demo) {
        setRunError(data.message);
        setRunning(false);
        return;
      }
      if (!res.ok) {
        setRunError(data.error || "Run failed to start.");
        setRunning(false);
        return;
      }
      setActiveRun(data.run ?? null);
      setActiveSteps(data.steps ?? []);
      setGoal("");
      onApprovalsChanged();
      loadHistory();
      onChanged();
    } catch {
      setRunError("Network error. Try again.");
    } finally {
      setRunning(false);
    }
  }

  async function openRun(runId: string) {
    try {
      const res = await fetch(`/api/agents/runs/${runId}`);
      const data = await res.json();
      setActiveRun(data.run ?? null);
      setActiveSteps(data.steps ?? []);
    } catch {
      /* ignore */
    }
  }

  async function toggleEnabled() {
    await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: !agent.enabled })
    });
    onChanged();
  }

  async function remove() {
    if (!confirm(`Delete "${agent.name}"? Its run history will be removed.`)) return;
    await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
    onChanged();
    onClose();
  }

  async function onApprovalResolved() {
    // Re-pull the active run (its status will have advanced) + approvals.
    if (activeRun) await openRun(activeRun.id);
    onApprovalsChanged();
    loadHistory();
  }

  const activeApprovals = activeRun ? approvals.filter((a) => a.runId === activeRun.id) : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-ink-200 bg-white/90 px-5 py-4 backdrop-blur">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-terracotta-500 to-terracotta-700 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold leading-tight">{agent.name}</h2>
            <p className="mt-0.5 text-xs text-ink-500">{agent.description}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            <Badge tone={agent.enabled ? "success" : "neutral"}>
              <Power className="h-3 w-3" /> {agent.enabled ? "Active" : "Paused"}
            </Badge>
            {isScheduled && (
              <Badge tone="info">
                <CalendarClock className="h-3 w-3" /> {agent.schedule}
              </Badge>
            )}
            {isWebhook && (
              <Badge tone="savanna">
                <Webhook className="h-3 w-3" /> {agent.eventTrigger}
              </Badge>
            )}
            {agent.autoApproveThresholdUsd != null && (
              <Badge tone="sand">
                <Zap className="h-3 w-3" /> Auto-approve ≤ ${agent.autoApproveThresholdUsd}
              </Badge>
            )}
          </div>

          {/* Run now */}
          {isManual && (
            <div className="rounded-xl border border-ink-200 p-4">
              <h3 className="text-sm font-semibold text-ink-900">Run now</h3>
              <p className="mt-0.5 text-xs text-ink-500">
                {agent.kind === "shipment_pilot"
                  ? "Describe the shipment — product, origin, destination, FOB value, exporter, and consignee."
                  : "Trigger this agent on demand."}
              </p>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={agent.kind === "shipment_pilot" ? 3 : 2}
                placeholder={
                  agent.kind === "shipment_pilot"
                    ? "e.g. 500kg washed Arabica green coffee, Ethiopia → Kenya, FOB $4,200. Exporter: Yirgacheffe Union. Consignee: Nairobi Roasters Ltd."
                    : "Optional instructions…"
                }
                className="mt-2 w-full resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-terracotta-400 focus:outline-none"
              />
              {runError && <p className="mt-1.5 text-xs text-red-600">{runError}</p>}
              <button
                type="button"
                onClick={runNow}
                disabled={running || !agent.enabled}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
              >
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {running ? "Running…" : "Run agent"}
              </button>
              {!agent.enabled && <p className="mt-1.5 text-xs text-amber-600">Enable the agent to run it.</p>}
            </div>
          )}

          {/* Pending approvals for the active run */}
          {activeApprovals.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-600">Awaiting your approval</h3>
              {activeApprovals.map((a) => (
                <ApprovalCard key={a.id} approval={a} onResolved={onApprovalResolved} />
              ))}
            </div>
          )}

          {/* Active run trace */}
          {activeRun && (
            <div className="rounded-xl border border-ink-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink-900">Run trace</h3>
              <RunTrace run={activeRun} steps={activeSteps} />
            </div>
          )}

          {/* Run history */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Recent runs</h3>
            {isDemo ? (
              <p className="rounded-lg bg-sand-50 px-3 py-2 text-xs text-ink-500">
                Sign in and connect a database to run this agent and see its history.
              </p>
            ) : history.length === 0 ? (
              <p className="text-xs text-ink-500">No runs yet.</p>
            ) : (
              <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200">
                {history.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => openRun(r.id)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-sand-50",
                        activeRun?.id === r.id && "bg-sand-50"
                      )}
                    >
                      <Badge tone={RUN_STATUS_TONE[r.status] ?? "neutral"}>{r.status.replace("_", " ")}</Badge>
                      <span className="min-w-0 flex-1 truncate text-ink-600">
                        {r.summary || r.goal || r.error || "—"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-ink-400">
                        <Clock className="h-3 w-3" />
                        {fmtDate(r.createdAt)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-ink-300" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Management */}
          {canManage && !isDemo && (
            <div className="flex items-center gap-2 border-t border-ink-200 pt-4">
              <button
                type="button"
                onClick={toggleEnabled}
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
              >
                <Power className="h-3.5 w-3.5" />
                {agent.enabled ? "Pause" : "Enable"}
              </button>
              <button
                type="button"
                onClick={remove}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
