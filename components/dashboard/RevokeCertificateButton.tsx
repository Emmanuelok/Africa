"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Loader2, X, AlertTriangle } from "lucide-react";

export function RevokeCertificateButton({
  certificateId,
  reference,
  canRevoke
}: {
  certificateId: string;
  reference: string;
  canRevoke: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit() {
    if (reason.trim().length < 3) {
      setError("Give a short reason (≥3 chars).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/certificates/${certificateId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not revoke");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke");
    } finally {
      setBusy(false);
    }
  }

  if (!canRevoke) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-terracotta-700 hover:underline"
      >
        <Ban className="h-3.5 w-3.5" /> Revoke
      </button>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-terracotta-100 text-terracotta-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-semibold">Revoke {reference}?</h2>
                <p className="mt-1 text-sm text-ink-700">
                  Revoking marks the certificate invalid. Anyone scanning its QR code or visiting the
                  verification page will see it as revoked. This cannot be undone — issue a new
                  certificate if needed.
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-md text-ink-400 hover:bg-ink-50 hover:text-ink-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-wide text-ink-500">Reason</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. wrong HS code, shipment cancelled"
                className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                autoFocus
              />
            </label>
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-terracotta-50 p-2 text-xs text-terracotta-800">
                <AlertTriangle className="mt-0.5 h-3 w-3" /> {error}
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-ink-300 px-4 py-2 text-sm font-medium hover:bg-ink-50">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy || reason.trim().length < 3}
                className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Revoke certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
