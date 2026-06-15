import { describe, it, expect } from "vitest";
import {
  DEMO_PROJECTS,
  isDemoProjectId,
  inviteToken,
  previewInvite,
  redeemInvite,
  listEvents,
  listMembers,
  listProjectsForUser,
  createProject
} from "@/lib/data/projects";

describe("projects demo fixtures", () => {
  it("ships a trade room and a study room", () => {
    expect(DEMO_PROJECTS).toHaveLength(2);
    expect(DEMO_PROJECTS.find((p) => p.kind === "trade")).toBeTruthy();
    expect(DEMO_PROJECTS.find((p) => p.kind === "study")).toBeTruthy();
  });

  it("isDemoProjectId distinguishes demo from real ids", () => {
    expect(isDemoProjectId("proj_demo_trade")).toBe(true);
    expect(isDemoProjectId("550e8400-e29b-41d4-a716-446655440000")).toBe(false);
  });
});

describe("invite tokens", () => {
  it("are URL-safe and unique", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const t = inviteToken();
      expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(t.length).toBeGreaterThan(16);
      expect(seen.has(t)).toBe(false);
      seen.add(t);
    }
  });
});

describe("invite preview / redeem (demo path)", () => {
  it("previews a valid demo link", async () => {
    const p = await previewInvite("demo-shareable-link-token");
    expect(p.valid).toBe(true);
    expect(p.project?.name).toContain("Rules of Origin");
    expect(p.role).toBe("editor");
  });

  it("rejects an unknown token in demo mode", async () => {
    const p = await previewInvite("does-not-exist");
    expect(p.valid).toBe(false);
  });

  it("redeem reports the demo-mode constraint", async () => {
    const r = await redeemInvite("any-token", { id: "u1", name: "Test", email: "t@example.com" });
    expect(r.ok).toBe(false);
  });
});

describe("listing in demo mode", () => {
  it("listEvents returns the seeded feed", async () => {
    const events = await listEvents("proj_demo_study", "demo-user");
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e) => e.kind === "question")).toBe(true);
  });

  it("listMembers marks the viewer correctly", async () => {
    const members = await listMembers("proj_demo_trade", "demo-user");
    const self = members.find((m) => m.isSelf);
    expect(self?.userId).toBe("demo-user");
    expect(self?.role).toBe("owner");
  });

  it("listProjectsForUser returns the demo set for demo users", async () => {
    const projects = await listProjectsForUser("demo-user", true);
    expect(projects.length).toBe(2);
  });
});

describe("createProject (demo)", () => {
  it("returns a synthetic id and counts the creator", async () => {
    const p = await createProject({
      workspaceId: "demo-workspace",
      kind: "study",
      name: "Test cohort",
      user: { id: "demo-user", name: "Tester", email: "t@example.com" }
    });
    expect(p.id).toMatch(/^proj_demo_/);
    expect(p.memberCount).toBe(1);
    expect(p.role).toBe("owner");
  });
});
