"use client";

import { useState } from "react";
import { Copy, Plus, Trash2, Check, Loader2, AlertTriangle, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { DemoApiKey } from "@/lib/data/demo-store";

const AVAILABLE_SCOPES: Array<{ id: string; label: string }> = [
  { id: "*", label: "Full access (all endpoints)" },
  { id: "classify", label: "/v1/classify" },
  { id: "determine-origin", label: "/v1/determine-origin" },
  { id: "tariff", label: "/v1/tariff" },
  { id: "certificates", label: "/v1/certificates" },
  { id: "shipments", label: "/v1/shipments" }
];

export function ApiKeysManager({
  initial,
  isDemo
}: {
  initial: DemoApiKey[];
  isDemo: boolean;
}) {
  const [keys, setKeys] = useState<DemoApiKey[]>(initial);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState<"live" | "test">("test");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["*"]);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleScope(s: string) {
    setNewKeyScopes((prev) => {
      if (s === "*") return prev.includes("*") ? [] : ["*"];
      const without = prev.filter((x) => x !== "*");
      if (without.includes(s)) return without.filter((x) => x !== s);
      return [...without, s];
    });
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    if (newKeyScopes.length === 0) {
      setError("Pick at least one scope.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, env: newKeyEnv, scopes: newKeyScopes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create key");
      setRevealed(data.plaintext);
      setKeys((prev) => [
        {
          id: data.id ?? `key_${Math.random().toString(36).slice(2, 10)}`,
          name: newKeyName,
          prefix: data.prefix,
          maskedKey: `${data.prefix}••••••••••••${data.suffix}`,
          scopes: data.scopes ?? newKeyScopes,
          lastUsedAt: null,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
      setNewKeyName("");
      setNewKeyScopes(["*"]);
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? Any service using it will stop working immediately.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      setError("Failed to revoke key");
    } finally {
      setBusy(false);
    }
  }

  function copy(value: string) {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-4">
      {/* Reveal panel — shown only right after creation */}
      {revealed && (
        <Card className="border-savanna-300 bg-savanna-50/60">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-savanna-700" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">Your new API key</div>
              <p className="mt-1 text-sm text-ink-700">
                Copy it now — we&apos;ll never show this again. Store it in a secrets manager, not in
                source control.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-950 px-3 py-2 font-mono text-xs text-ink-100">
                <code className="truncate flex-1 break-all">{revealed}</code>
                <button
                  onClick={() => copy(revealed)}
                  className="shrink-0 rounded-md bg-ink-800 px-2 py-1 text-ink-100 hover:bg-ink-700"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                onClick={() => setRevealed(null)}
                className="mt-3 text-xs text-ink-600 underline-offset-2 hover:underline"
              >
                I&apos;ve saved it — dismiss
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Create */}
      {creating ? (
        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs uppercase tracking-wide text-ink-500">Key name</label>
              <input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="production-erp"
                className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-ink-500">Env</label>
              <select
                value={newKeyEnv}
                onChange={(e) => setNewKeyEnv(e.target.value as "live" | "test")}
                className="mt-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
              >
                <option value="test">Test</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div className="basis-full">
              <label className="text-xs uppercase tracking-wide text-ink-500">Scopes</label>
              <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {AVAILABLE_SCOPES.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-sand-50">
                    <input
                      type="checkbox"
                      checked={newKeyScopes.includes(s.id)}
                      onChange={() => toggleScope(s.id)}
                    />
                    <code className="font-mono text-xs">{s.id}</code>
                    <span className="text-xs text-ink-500">— {s.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Use the narrowest set that works. Picking <code>*</code> grants full access and disables per-endpoint limits.
              </p>
            </div>
            <div className="basis-full flex gap-2">
              <button
                onClick={createKey}
                disabled={!newKeyName.trim() || busy || newKeyScopes.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Create key
              </button>
              <button
                onClick={() => { setCreating(false); setError(null); }}
                className="rounded-lg border border-ink-300 px-4 py-2 text-sm hover:bg-ink-50"
              >
                Cancel
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-3 rounded-lg bg-terracotta-50 p-2 text-xs text-terracotta-800">{error}</div>
          )}
        </Card>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
        >
          <Plus className="h-4 w-4" /> Create API key
        </button>
      )}

      {/* List */}
      <Card className="p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-sand-50">
            <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Env</th>
              <th className="px-4 py-3">Scopes</th>
              <th className="px-4 py-3">Last used</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {keys.map((k) => (
              <tr key={k.id}>
                <td className="px-4 py-3 font-medium">{k.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-600">{k.maskedKey}</td>
                <td className="px-4 py-3">
                  {k.prefix === "sk_live_" ? <Badge tone="terracotta">Live</Badge> : <Badge tone="neutral">Test</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(k.scopes ?? ["*"]).map((s) => (
                      <code key={s} className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-mono">{s}</code>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-ink-600">
                  {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                </td>
                <td className="px-4 py-3 text-xs text-ink-600">
                  {new Date(k.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => revoke(k.id)}
                    disabled={isDemo}
                    title={isDemo ? "Demo mode" : "Revoke"}
                    className="text-ink-400 hover:text-terracotta-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-500">
                  No API keys yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
