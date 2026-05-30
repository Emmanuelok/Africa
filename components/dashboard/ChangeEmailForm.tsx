"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Mail, AlertCircle, Check, Eye, EyeOff } from "lucide-react";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/users/me/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not request change");
      setStatus("ok");
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Could not request change");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-terracotta-700 hover:underline"
      >
        Change email →
      </button>
    );
  }

  if (status === "ok") {
    return (
      <div className="rounded-lg border border-savanna-300 bg-savanna-50 p-3 text-sm text-savanna-900">
        <div className="flex items-start gap-2">
          <Check className="mt-0.5 h-4 w-4 text-savanna-600" />
          <div>
            Confirmation link sent to <strong>{newEmail}</strong>. Open it from that inbox to
            complete the swap. Your current email stays active until you confirm.
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-ink-200 p-3">
      <div className="text-xs text-ink-600">
        We send a confirmation to the new address. Your sign-in stays as{" "}
        <code className="font-mono">{currentEmail}</code> until you click the link.
      </div>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-ink-500">New email</span>
        <input
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="new@coop.africa"
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-ink-500">Current password</span>
        <div className="relative mt-1">
          <input
            type={showPw ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 pr-10 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          />
          <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={status === "sending" || !newEmail || !password}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
        >
          {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Send confirmation
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setStatus("idle"); setError(""); setNewEmail(""); setPassword(""); }}
          className="rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium hover:bg-ink-50"
        >
          Cancel
        </button>
      </div>
      {status === "err" && (
        <div className="flex items-start gap-2 rounded-lg bg-terracotta-50 p-2 text-xs text-terracotta-800">
          <AlertCircle className="mt-0.5 h-3 w-3" /> {error}
        </div>
      )}
    </form>
  );
}
