"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Loader2, Trash2 } from "lucide-react";

export function DeleteAccountDialog({
  totpEnabled,
  trigger
}: {
  totpEnabled: boolean;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit() {
    if (confirm !== "DELETE") return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, totp: totp || undefined, confirm })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not delete account");
      router.push("/?deleted=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-terracotta-100 text-terracotta-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-semibold">Delete your account?</h2>
                <p className="mt-1 text-sm text-ink-700">
                  This permanently removes your user, your notification prefs, and any workspaces
                  where you are the sole owner with no other members. Workspaces shared with
                  others must be transferred or deleted first.
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-ink-400 hover:bg-ink-50 hover:text-ink-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-ink-500">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                />
              </label>
              {totpEnabled && (
                <label className="block">
                  <span className="text-xs uppercase tracking-wide text-ink-500">2FA code or recovery code</span>
                  <input
                    value={totp}
                    onChange={(e) => setTotp(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 font-mono text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                  />
                </label>
              )}
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-ink-500">Type DELETE to confirm</span>
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 font-mono text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                />
              </label>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-800">
                <AlertTriangle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium hover:bg-ink-50">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy || confirm !== "DELETE" || !password || (totpEnabled && !totp)}
                className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
