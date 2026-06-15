"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

export function JoinButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/join/${token}`, { method: "POST" });
      const data = await res.json();
      if (data.requiresAuth) {
        router.push(`/signin?callbackUrl=${encodeURIComponent(`/join/${token}`)}`);
        return;
      }
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not join.");
        setBusy(false);
        return;
      }
      router.push(`/dashboard/projects/${data.projectId}`);
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={join}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {busy ? "Joining…" : "Join project"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
