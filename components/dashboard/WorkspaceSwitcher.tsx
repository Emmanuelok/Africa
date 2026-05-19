"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";

type Workspace = {
  id: string;
  name: string;
  plan: string;
  role: string;
};

export function WorkspaceSwitcher({
  workspaces,
  activeId
}: {
  workspaces: Workspace[];
  activeId: string;
}) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function switchTo(id: string) {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    setSwitching(id);
    try {
      await fetch("/api/workspaces/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      router.refresh();
    } catch {
      setSwitching(null);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-left hover:bg-sand-50"
        aria-label="Switch workspace"
      >
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-terracotta-600 text-xs font-semibold text-white">
          {active?.name.charAt(0) ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{active?.name}</div>
          <div className="text-[10px] uppercase tracking-wide text-ink-500">
            {active?.plan} · {active?.role}
          </div>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-xl border border-ink-200 bg-white shadow-xl">
          <ul className="py-1">
            {workspaces.map((w) => (
              <li key={w.id}>
                <button
                  onClick={() => switchTo(w.id)}
                  disabled={switching !== null}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-sand-50 disabled:opacity-50"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-terracotta-600 text-xs font-semibold text-white">
                    {w.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{w.name}</div>
                    <div className="text-[10px] uppercase tracking-wide text-ink-500">
                      {w.plan} · {w.role}
                    </div>
                  </div>
                  {switching === w.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" />
                  ) : w.id === activeId ? (
                    <Check className="h-3.5 w-3.5 text-savanna-600" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-ink-100 p-1.5">
            <button
              disabled
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-ink-500 hover:bg-sand-50 disabled:cursor-not-allowed"
              title="Coming soon"
            >
              <Plus className="h-3.5 w-3.5" /> Create workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
