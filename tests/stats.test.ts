import { describe, it, expect } from "vitest";
import { workspaceStats } from "@/lib/data/determinations";
import { DEMO_DETERMINATIONS, DEMO_CERTIFICATES } from "@/lib/data/demo-store";

describe("workspaceStats (demo path)", () => {
  it("aggregates the full demo set, not a truncated slice", async () => {
    const stats = await workspaceStats("demo-workspace");

    expect(stats.determinations).toBe(DEMO_DETERMINATIONS.length);
    expect(stats.certificates).toBe(DEMO_CERTIFICATES.length);
  });

  it("sums savings across every determination", async () => {
    const stats = await workspaceStats("demo-workspace");
    const expected = DEMO_DETERMINATIONS.reduce((s, d) => s + d.savingsUsd, 0);
    expect(stats.totalSavingsUsd).toBe(expected);
  });

  it("counts qualifying determinations", async () => {
    const stats = await workspaceStats("demo-workspace");
    const expected = DEMO_DETERMINATIONS.filter((d) => d.qualifies === "yes").length;
    expect(stats.qualifying).toBe(expected);
  });

  it("counts endorsed certificates", async () => {
    const stats = await workspaceStats("demo-workspace");
    const expected = DEMO_CERTIFICATES.filter((c) => c.endorsedByAuthority).length;
    expect(stats.endorsedCertificates).toBe(expected);
  });

  it("sums FOB value", async () => {
    const stats = await workspaceStats("demo-workspace");
    const expected = DEMO_DETERMINATIONS.reduce((s, d) => s + d.fobValueUsd, 0);
    expect(stats.totalFobUsd).toBe(expected);
  });
});
