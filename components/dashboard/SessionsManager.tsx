"use client";

import { useEffect, useState } from "react";
import { Loader2, Monitor, LogOut, Shield, AlertCircle, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Session = {
  id: string;
  current: boolean;
  expires: string;
  createdAt: string;
  fingerprint: string;
  masked: string;
};

export function SessionsManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/sessions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not load sessions");
      setSessions(data.sessions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sessions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function revoke(id: string) {
    if (!confirm("Sign out this session?")) return;
    setBusy(id);
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not revoke");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke");
    } finally {
      setBusy(null);
    }
  }

  async function revokeAll() {
    if (!confirm("Sign out every other session? Your current session stays active.")) return;
    setBusy("all");
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not revoke");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
        </div>
      </Card>
    );
  }

  const others = sessions.filter((s) => !s.current);

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-800">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
        </div>
      )}

      {others.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={revokeAll}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-terracotta-300 px-3 py-2 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50 disabled:opacity-50"
          >
            {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign out all other sessions
          </button>
        </div>
      )}

      <Card className="p-0">
        <ul className="divide-y divide-ink-100">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sand-100 text-ink-700">
                <Monitor className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs">{s.fingerprint}</code>
                  {s.current && (
                    <Badge tone="savanna">
                      <Check className="h-3 w-3" /> This session
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-ink-600">
                  Expires {new Date(s.expires).toLocaleString()}
                </div>
              </div>
              {!s.current && (
                <button
                  onClick={() => revoke(s.id)}
                  disabled={busy !== null}
                  className="rounded-lg border border-ink-300 px-3 py-1.5 text-xs font-medium hover:bg-ink-50 disabled:opacity-50"
                >
                  {busy === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Revoke"}
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-xs text-ink-500">
        <Shield className="mr-1 inline-block h-3 w-3" />
        Sessions expire after 30 days of inactivity. Revoking signs that browser out immediately.
      </p>
    </div>
  );
}
