"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Send,
  Webhook,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";

type Endpoint = {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  enabled: boolean;
  lastDeliveryAt: string | null;
  consecutiveFailures: number;
  createdAt: string;
};

type Delivery = {
  id: string;
  event: string;
  statusCode: number | null;
  succeeded: boolean;
  durationMs: number | null;
  attempts: number;
  createdAt: string;
};

export function WebhooksManager({ initial, isDemo }: { initial: Endpoint[]; isDemo: boolean }) {
  const [endpoints, setEndpoints] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openEndpoint, setOpenEndpoint] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [testStatus, setTestStatus] = useState<Record<string, string>>({});

  async function create() {
    if (!newUrl.startsWith("https://")) {
      setError("URL must start with https://");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, description: newDesc, events: newEvents })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create endpoint");
      setRevealedSecret(data.secret);
      setEndpoints((prev) => [
        {
          id: `wh_${Math.random().toString(36).slice(2, 10)}`,
          url: newUrl,
          description: newDesc || null,
          events: newEvents,
          enabled: true,
          lastDeliveryAt: null,
          consecutiveFailures: 0,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
      setNewUrl("");
      setNewDesc("");
      setNewEvents([]);
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create endpoint");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this webhook endpoint? Future events won't be delivered.")) return;
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    setEndpoints((prev) => prev.filter((e) => e.id !== id));
  }

  async function test(id: string) {
    setTestStatus((s) => ({ ...s, [id]: "Sending…" }));
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTestStatus((s) => ({ ...s, [id]: data.message ?? "Sent" }));
      void loadDeliveries(id);
    } catch {
      setTestStatus((s) => ({ ...s, [id]: "Test failed" }));
    }
    setTimeout(() => setTestStatus((s) => { const n = { ...s }; delete n[id]; return n; }), 4000);
  }

  async function loadDeliveries(id: string) {
    const res = await fetch(`/api/webhooks/${id}/deliveries`);
    const data = await res.json();
    setDeliveries((d) => ({ ...d, [id]: data.deliveries ?? [] }));
  }

  function toggleOpen(id: string) {
    if (openEndpoint === id) {
      setOpenEndpoint(null);
    } else {
      setOpenEndpoint(id);
      if (!deliveries[id]) void loadDeliveries(id);
    }
  }

  function copySecret() {
    if (!revealedSecret) return;
    void navigator.clipboard.writeText(revealedSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-4">
      {revealedSecret && (
        <Card className="border-savanna-300 bg-savanna-50/60">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-savanna-700" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Webhook signing secret</div>
              <p className="mt-1 text-sm text-ink-700">
                Save this now — we won&apos;t show it again. Use it to verify every webhook
                payload&apos;s <code className="rounded bg-white px-1 py-0.5 text-xs">Sokoni-Signature</code> header.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-950 px-3 py-2 font-mono text-xs text-ink-100">
                <code className="flex-1 truncate break-all">{revealedSecret}</code>
                <button
                  onClick={copySecret}
                  className="shrink-0 rounded-md bg-ink-800 px-2 py-1 text-ink-100 hover:bg-ink-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                onClick={() => setRevealedSecret(null)}
                className="mt-3 text-xs text-ink-600 underline-offset-2 hover:underline"
              >
                I&apos;ve saved it — dismiss
              </button>
            </div>
          </div>
        </Card>
      )}

      {creating ? (
        <Card>
          <h3 className="font-semibold">New webhook endpoint</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-ink-500">URL</label>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://api.your-erp.com/sokoni/webhooks"
                className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
              />
              <div className="mt-1 text-xs text-ink-500">Must use HTTPS.</div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink-500">Description (optional)</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Production ERP integration"
                className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink-500">Events</label>
              <div className="mt-1 grid gap-1 sm:grid-cols-2">
                {WEBHOOK_EVENTS.map((ev) => (
                  <label key={ev} className="flex items-center gap-2 rounded-md p-1.5 text-sm hover:bg-sand-50">
                    <input
                      type="checkbox"
                      checked={newEvents.includes(ev)}
                      onChange={(e) =>
                        setNewEvents((prev) =>
                          e.target.checked ? [...prev, ev] : prev.filter((x) => x !== ev)
                        )
                      }
                    />
                    <code className="font-mono text-xs">{ev}</code>
                  </label>
                ))}
              </div>
              <div className="mt-1 text-xs text-ink-500">
                Leave empty to receive <em>all</em> events.
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={create}
                disabled={busy || !newUrl.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4" />}
                Create endpoint
              </button>
              <button
                onClick={() => { setCreating(false); setError(null); }}
                className="rounded-lg border border-ink-300 px-4 py-2 text-sm hover:bg-ink-50"
              >
                Cancel
              </button>
            </div>
            {error && (
              <div className="rounded-lg bg-terracotta-50 p-2 text-xs text-terracotta-800">{error}</div>
            )}
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
        >
          <Plus className="h-4 w-4" /> Add endpoint
        </button>
      )}

      {endpoints.length === 0 ? (
        <Card className="text-center">
          <Webhook className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 text-ink-600">No webhooks yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {endpoints.map((e) => (
            <Card key={e.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="truncate font-mono text-sm font-medium">{e.url}</code>
                    {e.enabled ? <Badge tone="savanna">Live</Badge> : <Badge tone="neutral">Paused</Badge>}
                    {e.consecutiveFailures > 0 && (
                      <Badge tone="terracotta">{e.consecutiveFailures} failures</Badge>
                    )}
                  </div>
                  {e.description && (
                    <div className="mt-1 text-xs text-ink-600">{e.description}</div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(e.events.length === 0 ? ["all events"] : e.events).map((ev) => (
                      <code key={ev} className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-mono">
                        {ev}
                      </code>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => test(e.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink-300 px-3 py-1.5 text-xs hover:bg-ink-50"
                  >
                    <Send className="h-3 w-3" /> Test
                  </button>
                  <button
                    onClick={() => toggleOpen(e.id)}
                    className="rounded-lg border border-ink-300 px-3 py-1.5 text-xs hover:bg-ink-50"
                  >
                    {openEndpoint === e.id ? "Hide" : "Deliveries"}
                  </button>
                  <button
                    onClick={() => remove(e.id)}
                    disabled={isDemo}
                    className="text-ink-400 hover:text-terracotta-700 disabled:opacity-50"
                    title={isDemo ? "Demo mode" : "Delete"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {testStatus[e.id] && (
                <div className="mt-2 rounded-lg bg-sand-50 px-2 py-1 text-xs text-ink-700">
                  {testStatus[e.id]}
                </div>
              )}
              {openEndpoint === e.id && (
                <div className="mt-4 border-t border-ink-100 pt-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Recent deliveries
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {(deliveries[e.id] ?? []).map((d) => (
                      <li
                        key={d.id}
                        className="flex items-center justify-between rounded-md bg-sand-50/50 px-2.5 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {d.succeeded ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-savanna-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-terracotta-600" />
                          )}
                          <code className="font-mono">{d.event}</code>
                        </div>
                        <div className="flex items-center gap-3 text-ink-600">
                          <span className="font-mono">{d.statusCode ?? "—"}</span>
                          <span>{d.durationMs ?? "—"}ms</span>
                          <span>{new Date(d.createdAt).toLocaleString()}</span>
                        </div>
                      </li>
                    ))}
                    {(deliveries[e.id]?.length ?? 0) === 0 && (
                      <li className="rounded-md bg-sand-50/50 px-2.5 py-2 text-center text-xs text-ink-500">
                        No deliveries yet. Click <strong>Test</strong> to send a synthetic event.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
