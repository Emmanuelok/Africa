"use client";

import { useState, type FormEvent } from "react";
import { UserPlus, Loader2, Check, AlertCircle, X } from "lucide-react";

export function InviteForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role })
      });
      const data = await res.json();
      if (!res.ok && res.status !== 503) throw new Error(data?.error ?? "Failed to send invitation");
      setStatus("ok");
      setMessage(
        data?.isDemo
          ? "Demo mode — invitation would be emailed in production."
          : `Invitation sent to ${email}.`
      );
      setEmail("");
    } catch (err) {
      setStatus("err");
      setMessage(err instanceof Error ? err.message : "Failed");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
      >
        <UserPlus className="h-4 w-4" /> Invite member
      </button>
    );
  }

  return (
    <form onSubmit={send} className="rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Invite teammate</div>
        <button
          type="button"
          onClick={() => { setOpen(false); setStatus("idle"); }}
          aria-label="Close"
          className="text-ink-400 hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@coop.africa"
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "member" | "admin")}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
        >
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Send invitation
        </button>
        {status === "ok" && (
          <span className="inline-flex items-center gap-1 text-sm text-savanna-700">
            <Check className="h-4 w-4" /> {message}
          </span>
        )}
        {status === "err" && (
          <span className="inline-flex items-center gap-1 text-sm text-terracotta-700">
            <AlertCircle className="h-4 w-4" /> {message}
          </span>
        )}
      </div>
    </form>
  );
}
