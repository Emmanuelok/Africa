import { getSessionUser } from "@/lib/server/session";
import { AgentsConsole } from "@/components/dashboard/agents/AgentsConsole";
import { Bot } from "lucide-react";

export const metadata = { title: "Agents — Sokoni" };
export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const user = await getSessionUser();
  const canManage = user.role === "owner" || user.role === "admin";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold md:text-3xl">Agents</h1>
            <span className="sticker rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
              Autopilot
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ink-600">
            Autonomous agents that classify shipments, run Rules of Origin, watch for missed AfCFTA savings, and
            review certificates — working in the background, pausing for your approval on anything that matters.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs text-ink-500 sm:flex">
          <Bot className="h-4 w-4 text-terracotta-600" />
          Human-in-the-loop · audited · scoped to {user.workspaceName}
        </div>
      </header>

      <AgentsConsole canManage={canManage} isDemo={user.isDemo} />
    </div>
  );
}
