import { describe, it, expect } from "vitest";

// Unit tests for the agent platform's pure pieces: the tool registry, the
// template catalogue, and the cron estimator. The engine itself needs a live
// model so it's exercised manually / in integration, not here.

import { TOOLS, toolsForAgent } from "@/lib/agents/tools";
import { AGENT_CATALOGUE, getAgentTemplate, listAgentTemplates } from "@/lib/agents/catalogue";
import { nextCronRun } from "@/lib/agents/store";

describe("agent tool registry", () => {
  it("exposes the expected tools with valid sensitivities", () => {
    const names = Object.keys(TOOLS);
    expect(names).toContain("classify");
    expect(names).toContain("determine_origin");
    expect(names).toContain("create_certificate");
    expect(names).toContain("request_approval");
    for (const t of Object.values(TOOLS)) {
      expect(["read_only", "mutating", "destructive"]).toContain(t.sensitivity);
      expect(t.inputSchema).toBeTypeOf("object");
      expect((t.inputSchema as { type?: string }).type).toBe("object");
      expect(t.name).toBeTruthy();
      expect(t.description.length).toBeGreaterThan(10);
    }
  });

  it("toolsForAgent resolves names and drops unknowns", () => {
    const defs = toolsForAgent(["classify", "does_not_exist", "lookup_tariff"]);
    expect(defs.map((d) => d.name)).toEqual(["classify", "lookup_tariff"]);
  });

  it("read-only tools execute without a database (graceful degradation)", async () => {
    const ctx = { agentId: "a", agentName: "Test", workspaceId: "demo-workspace", autoApproveThresholdUsd: null };
    const res = await TOOLS.lookup_tariff.handler({ hs_code: "0901" }, ctx);
    expect(res.ok).toBe(true);
  });
});

describe("agent catalogue", () => {
  it("every template references only registered tools", () => {
    for (const t of listAgentTemplates()) {
      for (const toolName of t.tools) {
        expect(TOOLS[toolName], `${t.kind} references unknown tool ${toolName}`).toBeDefined();
      }
    }
  });

  it("every template has at least one trigger and a system prompt", () => {
    for (const t of listAgentTemplates()) {
      expect(t.triggers.length).toBeGreaterThan(0);
      expect(t.systemPrompt.length).toBeGreaterThan(40);
    }
  });

  it("getAgentTemplate returns null for unknown kinds", () => {
    expect(getAgentTemplate("nope")).toBeNull();
    expect(getAgentTemplate("shipment_pilot")).toBe(AGENT_CATALOGUE.shipment_pilot);
  });
});

describe("nextCronRun", () => {
  it("schedules a daily 06:00 UTC job in the future", () => {
    const from = new Date("2026-06-14T03:00:00Z");
    const next = nextCronRun("0 6 * * *", from);
    expect(next.getUTCHours()).toBe(6);
    expect(next.getUTCMinutes()).toBe(0);
    expect(next.getTime()).toBeGreaterThan(from.getTime());
    // Same day since 06:00 is still ahead of 03:00.
    expect(next.getUTCDate()).toBe(14);
  });

  it("rolls a passed time to the next day", () => {
    const from = new Date("2026-06-14T08:00:00Z");
    const next = nextCronRun("0 6 * * *", from);
    expect(next.getUTCDate()).toBe(15);
    expect(next.getUTCHours()).toBe(6);
  });

  it("honours day-of-week (Sunday 18:00)", () => {
    const from = new Date("2026-06-14T19:00:00Z"); // Sunday evening, past 18:00
    const next = nextCronRun("0 18 * * 0", from);
    expect(next.getUTCDay()).toBe(0); // Sunday
    expect(next.getUTCHours()).toBe(18);
    expect(next.getTime()).toBeGreaterThan(from.getTime());
  });
});
