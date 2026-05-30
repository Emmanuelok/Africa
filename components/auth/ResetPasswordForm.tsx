"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, Check, ArrowRight } from "lucide-react";

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 12) {
      setStatus("err");
      setError("Password must be at least 12 characters.");
      return;
    }
    if (password !== confirm) {
      setStatus("err");
      setError("Passwords don't match.");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not reset password");
      setStatus("ok");
      setTimeout(() => { window.location.href = "/signin?reset=1"; }, 1500);
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Could not reset password");
    }
  }

  if (status === "ok") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-savanna-300 bg-savanna-50 p-3 text-sm text-savanna-900">
        <Check className="mt-0.5 h-5 w-5 text-savanna-600" />
        <div>
          <div className="font-semibold">Password reset.</div>
          <p className="mt-1 text-sm">Redirecting to sign-in…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-ink-500">New password (min. 12 chars)</span>
        <div className="relative mt-1">
          <input
            type={show ? "text" : "password"}
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 pr-10 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label="Toggle visibility"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-ink-500">Confirm new password</span>
        <input
          type={show ? "text" : "password"}
          required
          minLength={12}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
        />
      </label>
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta-600 px-5 py-3 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
      >
        {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Reset password
      </button>
      {status === "err" && (
        <div className="flex items-start gap-2 rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-800">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
        </div>
      )}
    </form>
  );
}
