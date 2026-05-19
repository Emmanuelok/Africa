"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, AlertCircle, Bell, Mail } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { NOTIFICATION_KINDS, NOTIFICATION_GROUPS } from "@/lib/notifications/kinds";

type PrefMap = Record<string, { inProduct: boolean; email: boolean }>;

export function NotificationPreferences({ initial }: { initial: PrefMap }) {
  const [prefs, setPrefs] = useState<PrefMap>(initial);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "err">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "saved") {
      const t = setTimeout(() => setStatus("idle"), 1800);
      return () => clearTimeout(t);
    }
  }, [status]);

  function toggle(kind: string, channel: "inProduct" | "email") {
    setPrefs((p) => ({
      ...p,
      [kind]: { ...p[kind], [channel]: !p[kind]?.[channel] }
    }));
    setDirty(true);
  }

  async function save() {
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Save failed");
      setStatus("saved");
      setDirty(false);
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="space-y-4">
      {NOTIFICATION_GROUPS.map((group) => {
        const kinds = NOTIFICATION_KINDS.filter((k) => k.group === group.id);
        if (kinds.length === 0) return null;
        return (
          <Card key={group.id} className="p-0">
            <div className="border-b border-ink-100 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">{group.label}</div>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-2">Event</th>
                  <th className="w-24 px-2 py-2 text-center">
                    <Bell className="mx-auto h-3.5 w-3.5" />
                  </th>
                  <th className="w-24 px-2 py-2 text-center">
                    <Mail className="mx-auto h-3.5 w-3.5" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {kinds.map((k) => {
                  const p = prefs[k.kind] ?? { inProduct: k.defaultInProduct, email: k.defaultEmail };
                  return (
                    <tr key={k.kind}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{k.label}</div>
                        <div className="mt-0.5 text-xs text-ink-600">{k.description}</div>
                        <code className="mt-1 inline-block font-mono text-[10px] text-ink-500">{k.kind}</code>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <Toggle checked={p.inProduct} onChange={() => toggle(k.kind, "inProduct")} />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <Toggle checked={p.email} onChange={() => toggle(k.kind, "email")} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        );
      })}

      <div className="sticky bottom-3 flex items-center justify-end gap-3 rounded-xl border border-ink-200 bg-white p-3 shadow-sm">
        {status === "saved" && (
          <span className="inline-flex items-center gap-1 text-sm text-savanna-700">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        {status === "err" && (
          <span className="inline-flex items-center gap-1 text-sm text-terracotta-700">
            <AlertCircle className="h-4 w-4" /> {error}
          </span>
        )}
        <button
          onClick={save}
          disabled={!dirty || status === "saving"}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
        >
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {dirty ? "Save preferences" : "No changes"}
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-terracotta-600" : "bg-ink-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
