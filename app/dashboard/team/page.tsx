import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UserPlus, Mail } from "lucide-react";
import { getSessionUser } from "@/lib/server/session";

export const metadata = { title: "Team — Sokoni" };

const DEMO_MEMBERS = [
  { name: "Amara Okonkwo", email: "demo@sokoni.africa", role: "Owner", initial: "A" },
  { name: "Kwame Mensah", email: "kwame@highlandscoffee.coop", role: "Admin", initial: "K" },
  { name: "Nadia Hassan", email: "nadia@highlandscoffee.coop", role: "Member", initial: "N" }
];

export default async function TeamPage() {
  const user = await getSessionUser();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold md:text-3xl">Team</h1>
          <p className="mt-1 text-sm text-ink-600">
            Manage members of <strong>{user.workspaceName}</strong>.
          </p>
        </div>
        <Button size="md">
          <UserPlus className="h-4 w-4" /> Invite member
        </Button>
      </header>

      <Card className="p-0">
        <ul className="divide-y divide-ink-100">
          {DEMO_MEMBERS.map((m) => (
            <li key={m.email} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-terracotta-100 text-sm font-semibold text-terracotta-700">
                  {m.initial}
                </div>
                <div>
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs text-ink-600">{m.email}</div>
                </div>
              </div>
              <Badge tone={m.role === "Owner" ? "terracotta" : m.role === "Admin" ? "savanna" : "neutral"}>
                {m.role}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 text-ink-500" />
          <div className="text-sm text-ink-700">
            <strong className="text-ink-900">Workspace plan limit:</strong>{" "}
            {user.plan === "bulk" ? "5 members" : user.plan === "forwarder" ? "unlimited" : "2 members"}.
            {user.plan !== "forwarder" && (
              <span className="ml-1">
                Need more? <a href="/pricing" className="text-terracotta-700 hover:underline">Upgrade your plan</a>.
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
