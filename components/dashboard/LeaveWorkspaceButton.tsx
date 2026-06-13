"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function LeaveWorkspaceButton({ workspaceName }: { workspaceName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function leave() {
    if (!confirm(`Leave ${workspaceName}? You'll lose access until you're re-invited.`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/team/leave", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not leave");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not leave");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={leave}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-terracotta-300 bg-white px-4 py-2 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        Leave workspace
      </button>
      {error && <p className="mt-2 text-xs text-terracotta-700">{error}</p>}
    </div>
  );
}
