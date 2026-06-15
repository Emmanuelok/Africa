import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/server/session";
import { getProjectForUser, listMembers, listEvents, listInvites } from "@/lib/data/projects";
import { ProjectRoom } from "@/components/projects/ProjectRoom";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const access = await getProjectForUser(params.id, user.id, user.isDemo);
  if (!access) return { title: "Project — Sokoni" };
  return { title: `${access.project.name} — Sokoni` };
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";
}

export default async function ProjectRoomPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const access = await getProjectForUser(params.id, user.id, user.isDemo);
  if (!access) notFound();

  const canManage = access.role === "owner";
  const [members, events, invitesRaw] = await Promise.all([
    listMembers(params.id, user.id),
    listEvents(params.id, user.id, { limit: 100 }),
    canManage ? listInvites(params.id) : Promise.resolve([])
  ]);
  const invites = invitesRaw.map((i) => ({
    id: i.id,
    token: i.token,
    role: i.role as "editor" | "viewer",
    email: i.email,
    maxUses: i.maxUses,
    uses: i.uses,
    expiresAt: i.expiresAt,
    createdAt: i.createdAt,
    url: `${siteUrl()}/join/${i.token}`
  }));

  return (
    <ProjectRoom
      project={access.project}
      members={members}
      events={events}
      invites={invites}
      viewer={{ id: user.id, name: user.name ?? user.email, isDemo: user.isDemo }}
      canManage={canManage}
    />
  );
}
