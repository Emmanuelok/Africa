"use client";

import { useState } from "react";
import { ShieldQuestion, Check, X, Loader2 } from "lucide-react";
import type { Approval } from "./types";

export function ApprovalCard({
  approval,
  onResolved
}: {
  approval: Approval;
  onResolved: (approvalId: string, decision: "approve" | "decline") => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolve(decision: "approve" | "decline") {
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch(`/api/agents/approvals/${approval.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, note: note || undefined })
      });
      const data = await res.json();
      if (!res.ok || data.demo) {
        setError(data.message || data.error || "Could not resolve.");
        setBusy(null);
        return;
      }
      onResolved(approval.id, decision);
    } catch {
      setError("Network error. Try again.");
      setBusy(null);
    }
  }

  const payload = approval.payload && typeof approval.payload === "object" ? approval.payload : null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-start gap-2.5">
        <ShieldQuestion className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-900">{approval.question}</p>
          {payload && (
            <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-2 text-[11px] leading-relaxed text-ink-700">
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)…"
            className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-sm focus:border-amber-400 focus:outline-none"
          />
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              disabled={!!busy}
              onClick={() => resolve("approve")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Approve
            </button>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => resolve("decline")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50"
            >
              {busy === "decline" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
