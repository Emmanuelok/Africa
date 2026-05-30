"use client";

import { useMemo, useState } from "react";
import {
  ShieldCheck,
  FileCheck2,
  Webhook,
  Key,
  Users2,
  CreditCard,
  LogIn,
  UserPlus,
  FileSpreadsheet,
  Search,
  X
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export type ActivityEntry = {
  id: string;
  action: string;
  actor: string | null;
  target: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "determination", label: "Determinations" },
  { id: "certificate", label: "Certificates" },
  { id: "webhook", label: "Webhooks" },
  { id: "api_key", label: "API keys" },
  { id: "billing", label: "Billing" },
  { id: "workspace", label: "Workspace" },
  { id: "user", label: "Auth" }
];

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (category !== "all" && !e.action.startsWith(`${category}.`)) return false;
      if (!q) return true;
      const hay = `${e.action} ${e.actor ?? ""} ${e.target ?? ""} ${JSON.stringify(e.metadata ?? {})}`.toLowerCase();
      return hay.includes(q);
    });
  }, [entries, query, category]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions, actors, targets, metadata…"
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-9 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-ink-400 hover:bg-ink-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === c.id
                ? "bg-terracotta-600 text-white"
                : "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="text-xs text-ink-500">
        {filtered.length} of {entries.length} {entries.length === 1 ? "entry" : "entries"}
      </div>

      <Card className="p-0">
        <ul className="divide-y divide-ink-100">
          {filtered.map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-4 py-3 text-sm">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sand-100 text-ink-700">
                {iconFor(e.action)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <code className="font-mono text-xs font-medium text-ink-900">{e.action}</code>
                  <Badge tone={toneFor(e.action)}>{tagFor(e.action)}</Badge>
                </div>
                <div className="mt-1 text-xs text-ink-600">
                  <strong className="text-ink-800">{e.actor ?? "system"}</strong>
                  {e.target && (
                    <>
                      {" "}· <code className="font-mono">{e.target}</code>
                    </>
                  )}
                  {e.metadata && Object.keys(e.metadata).length > 0 && (
                    <>
                      {" "}·{" "}
                      <span className="text-ink-500">
                        {Object.entries(e.metadata).slice(0, 3).map(([k, v], i) => (
                          <span key={k}>
                            {i > 0 && ", "}
                            {k}=<code className="font-mono">{String(v)}</code>
                          </span>
                        ))}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <time className="shrink-0 text-xs text-ink-500">
                {new Date(e.createdAt).toLocaleString()}
              </time>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-ink-500">
              {entries.length === 0 ? "No activity yet." : "No entries match your filters."}
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}

function iconFor(action: string) {
  if (action.startsWith("determination.")) return <ShieldCheck className="h-4 w-4" />;
  if (action.startsWith("certificate.")) return <FileCheck2 className="h-4 w-4" />;
  if (action.startsWith("webhook.")) return <Webhook className="h-4 w-4" />;
  if (action.startsWith("api_key.")) return <Key className="h-4 w-4" />;
  if (action.startsWith("workspace.")) return <Users2 className="h-4 w-4" />;
  if (action.startsWith("billing.")) return <CreditCard className="h-4 w-4" />;
  if (action === "user.signed_in") return <LogIn className="h-4 w-4" />;
  if (action === "user.registered") return <UserPlus className="h-4 w-4" />;
  if (action.startsWith("bulk.")) return <FileSpreadsheet className="h-4 w-4" />;
  return <ShieldCheck className="h-4 w-4" />;
}

function toneFor(action: string): "savanna" | "neutral" | "warn" | "terracotta" | "info" {
  if (action.endsWith(".revoked") || action.endsWith(".rejected") || action.endsWith(".canceled")) return "terracotta";
  if (action.endsWith(".marginal")) return "warn";
  if (action.startsWith("certificate.")) return "savanna";
  if (action.startsWith("billing.")) return "info";
  return "neutral";
}

function tagFor(action: string): string {
  return action.split(".")[0];
}
