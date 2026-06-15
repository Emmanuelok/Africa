import { getSessionUser } from "@/lib/server/session";
import { ProjectsConsole } from "@/components/projects/ProjectsConsole";

export const metadata = { title: "Projects — Sokoni" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getSessionUser();
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold md:text-3xl">Projects</h1>
            <span className="rounded-full bg-gradient-to-r from-savanna-500 to-terracotta-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Collaborate
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ink-600">
            Shared rooms for cross-organisation work and learning. Coordinate a shipment with your forwarder and
            buyer, or learn AfCFTA together with friends from anywhere — they don&apos;t need to be in your workspace.
          </p>
        </div>
      </header>

      <ProjectsConsole isDemo={user.isDemo} />
    </div>
  );
}
