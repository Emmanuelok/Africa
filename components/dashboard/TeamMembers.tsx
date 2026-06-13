"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, Crown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Member = {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  isSelf: boolean;
};

const ROLE_TONE = { owner: "terracotta", admin: "savanna", member: "neutral" } as const;

export function TeamMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [viewerRole, setViewerRole] = useState<string>("member");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/team/members", { cache: "no-store" });
      const data = await res.json();
      setMembers(data.members ?? []);
      setViewerRole(data.viewerRole ?? "member");
    } catch {
      setError("Could not load members");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void load(); }, []);

  async function changeRole(userId: string, role: string) {
    setBusy(userId);
    setError("");
    try {
      const res = await fetch(`/api/team/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not change role");
      setMembers((m) => m.map((x) => (x.userId === userId ? { ...x, role: role as Member["role"] } : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change role");
    } finally {
      setBusy(null);
    }
  }

  async function remove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this workspace?`)) return;
    setBusy(userId);
    setError("");
    try {
      const res = await fetch(`/api/team/members/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not remove");
      setMembers((m) => m.filter((x) => x.userId !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
        </div>
      </Card>
    );
  }

  const isOwner = viewerRole === "owner";
  const canManage = viewerRole === "owner" || viewerRole === "admin";

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-800">{error}</div>
      )}
      <Card className="p-0">
        <ul className="divide-y divide-ink-100">
          {members.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-terracotta-100 text-sm font-semibold text-terracotta-700">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {m.name}
                    {m.isSelf && <span className="text-xs text-ink-400">(you)</span>}
                  </div>
                  <div className="text-xs text-ink-600">{m.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && !m.isSelf ? (
                  <select
                    value={m.role}
                    disabled={busy === m.userId}
                    onChange={(e) => changeRole(m.userId, e.target.value)}
                    className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <Badge tone={ROLE_TONE[m.role]}>
                    {m.role === "owner" && <Crown className="h-3 w-3" />} {m.role}
                  </Badge>
                )}
                {canManage && !m.isSelf && (
                  <button
                    onClick={() => remove(m.userId, m.name)}
                    disabled={busy === m.userId}
                    title="Remove member"
                    className="text-ink-400 hover:text-terracotta-700 disabled:opacity-50"
                  >
                    {busy === m.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
