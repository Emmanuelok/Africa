import { getSessionUser } from "@/lib/server/session";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DemoBanner } from "@/components/dashboard/DemoBanner";

// auth() reads cookies — every dashboard route must be dynamic.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="min-h-[calc(100vh-65px)] bg-sand-50/40">
      <div className="mx-auto flex max-w-[1400px]">
        <DashboardSidebar
          workspaceName={user.workspaceName}
          plan={user.plan}
          userEmail={user.email}
        />
        <div className="min-w-0 flex-1">
          {user.isDemo && <DemoBanner />}
          <div className="px-4 py-6 md:px-8 md:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
