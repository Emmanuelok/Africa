"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, AlertTriangle, Trash2 } from "lucide-react";

export function DeleteWorkspaceDialog({
  workspaceId,
  workspaceName,
  trigger
}: {
  workspaceId: string;
  workspaceName: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [status, setStatus] = useState<"idle" | "deleting" | "err">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit() {
    if (confirm !== workspaceName) return;
    if (!password) {
      setStatus("err");
      setError("Password required.");
      return;
    }
    setStatus("deleting");
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm, password, totp: totp || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.code === "2fa_required") {
          setNeedsTotp(true);
          setStatus("idle");
          return;
        }
        throw new Error(data?.error ?? "Could not delete workspace");
      }
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Could not delete workspace");
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
                <h2 className="font-display text-xl font-semibold">Delete workspace?</h2>
                <p className="mt-1 text-sm text-ink-700">
                  This deletes every determination, certificate, webhook, API key, and audit log for{" "}
                  <strong>{workspaceName}</strong>. Stored certificate PDFs are removed from object storage.
                  Active subscriptions are cancelled. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-md text-ink-400 hover:bg-ink-50 hover:text-ink-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-ink-500">
                  Type the workspace name to confirm
                </span>
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={workspaceName}
                  className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-mono focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-ink-500">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                />
              </label>
              {needsTotp && (
                <label className="block">
                  <span className="text-xs uppercase tracking-wide text-ink-500">2FA code or recovery code</span>
                  <input
                    value={totp}
                    onChange={(e) => setTotp(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 font-mono text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                  />
                </label>
              )}
            </div>

            {status === "err" && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-800">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium hover:bg-ink-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={confirm !== workspaceName || status === "deleting" || !password || (needsTotp && !totp)}
                className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
              >
                {status === "deleting" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
