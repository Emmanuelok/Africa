// Agent tool registry. Each tool wraps an existing Sokoni capability and
// declares its JSON Schema input so the LLM can call it directly via the
// Anthropic tool-use protocol.
//
// Tools fall into three categories:
//   - read-only       → always safe to auto-execute
//   - mutating        → may require approval based on the agent's policy
//   - destructive     → always require approval, regardless of policy
//
// Tools receive an `AgentContext` so they can scope writes to the right
// workspace, attribute audit log entries, and reference the calling agent.

import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { classifyWithAI } from "@/lib/ai/classify";
import { determineOrigin as determineOriginEngine } from "@/lib/data/classifier";
import { lookupTariff } from "@/lib/data/tariffs";
import {
  saveDetermination,
  saveCertificate,
  listDeterminations,
  listCertificates,
  workspaceStats
} from "@/lib/data/determinations";
import { notify } from "@/lib/server/notify";
import { audit } from "@/lib/server/audit";
import { dispatch } from "@/lib/webhooks/dispatch";

export type AgentSensitivity = "read_only" | "mutating" | "destructive";

export type AgentContext = {
  agentId: string;
  agentName: string;
  workspaceId: string;
  // Operator policy: above this auto-approval threshold (USD savings on the
  // shipment in question), mutating tools execute without asking. Below it,
  // the engine pauses for approval.
  autoApproveThresholdUsd: number | null;
};

export type ToolResult = { ok: true; output: unknown } | { ok: false; error: string };

export type ToolDefinition = {
  name: string;
  description: string;
  sensitivity: AgentSensitivity;
  inputSchema: Record<string, unknown>; // JSON Schema for Claude
  zod: z.ZodTypeAny;                    // runtime validation
  // Returns the structured result. Throws on programmer error; returns
  // {ok:false} on user-visible failures so the LLM can react.
  handler: (input: unknown, ctx: AgentContext) => Promise<ToolResult>;
};

// =============================================================================
// classify
// =============================================================================
const ClassifyInput = z.object({
  description: z.string().min(1).max(2000)
});
const classifyTool: ToolDefinition = {
  name: "classify",
  description:
    "Classify a free-text product description to its HS-4 code. Returns the code, a confidence score (0-1), and up to three alternates. Use this before determining origin or generating a certificate.",
  sensitivity: "read_only",
  inputSchema: {
    type: "object",
    properties: { description: { type: "string", description: "Product description, e.g. 'Washed Arabica green coffee beans, AA grade'" } },
    required: ["description"]
  },
  zod: ClassifyInput,
  async handler(input) {
    const { description } = ClassifyInput.parse(input);
    const r = await classifyWithAI(description);
    return {
      ok: true,
      output: {
        hs_code: r.hsPrefix,
        description: r.description,
        confidence: r.confidence,
        source: r.source,
        alternates: r.alternates ?? []
      }
    };
  }
};

// =============================================================================
// determine_origin
// =============================================================================
const OriginInput = z.object({
  hs_code: z.string().min(4),
  whole_obtained: z.boolean().optional(),
  change_of_tariff_heading: z.boolean().optional(),
  regional_value_content: z.number().min(0).max(100).optional(),
  substantial_transformation: z.boolean().optional()
});
const determineOriginTool: ToolDefinition = {
  name: "determine_origin",
  description:
    "Apply the AfCFTA Rules of Origin engine to decide whether a shipment qualifies for preferential rates. Pass the boolean facts the engine needs (whole_obtained, change_of_tariff_heading, regional_value_content as a percentage, substantial_transformation). Returns 'yes' | 'no' | 'marginal' plus the rule that was applied.",
  sensitivity: "read_only",
  inputSchema: {
    type: "object",
    properties: {
      hs_code: { type: "string" },
      whole_obtained: { type: "boolean" },
      change_of_tariff_heading: { type: "boolean" },
      regional_value_content: { type: "number", description: "0-100 percent" },
      substantial_transformation: { type: "boolean" }
    },
    required: ["hs_code"]
  },
  zod: OriginInput,
  async handler(input) {
    const parsed = OriginInput.parse(input);
    const r = determineOriginEngine({
      hsChapter: parsed.hs_code.slice(0, 4),
      wholeObtained: parsed.whole_obtained,
      changeOfTariffHeading: parsed.change_of_tariff_heading,
      regionalValueContent: parsed.regional_value_content,
      underwentSubstantialTransformation: parsed.substantial_transformation
    });
    return { ok: true, output: { qualifies: r.qualifies, rule_applied: r.rule, reasoning: r.reasoning } };
  }
};

// =============================================================================
// lookup_tariff
// =============================================================================
const TariffInput = z.object({
  hs_code: z.string().min(4),
  origin: z.string().length(2).optional(),
  destination: z.string().length(2).optional()
});
const lookupTariffTool: ToolDefinition = {
  name: "lookup_tariff",
  description: "Look up the MFN duty rate and the AfCFTA preferential rate for an HS code on a given trade lane. Use this to compute savings.",
  sensitivity: "read_only",
  inputSchema: {
    type: "object",
    properties: {
      hs_code: { type: "string" },
      origin: { type: "string", description: "ISO-2 country code" },
      destination: { type: "string", description: "ISO-2 country code" }
    },
    required: ["hs_code"]
  },
  zod: TariffInput,
  async handler(input) {
    const { hs_code } = TariffInput.parse(input);
    const t = lookupTariff(hs_code.slice(0, 4));
    return {
      ok: true,
      output: {
        hs_code,
        mfn_rate: t?.mfnRate ?? null,
        afcfta_rate: t?.afcftaRate ?? null,
        description: t?.description ?? null
      }
    };
  }
};

// =============================================================================
// create_determination
// =============================================================================
const CreateDeterminationInput = z.object({
  description: z.string().min(1).max(2000),
  hs_code: z.string().min(4),
  origin: z.string().length(2),
  destination: z.string().length(2),
  fob_value_usd: z.number().nonnegative().optional(),
  quantity: z.number().nonnegative().optional(),
  qualifies: z.enum(["yes", "no", "marginal"]),
  rule_applied: z.string().min(1),
  confidence: z.number().min(0).max(1).optional()
});
const createDeterminationTool: ToolDefinition = {
  name: "create_determination",
  description:
    "Persist a determination to the workspace's history so the user can see it on the dashboard. Call after classify + determine_origin + lookup_tariff.",
  sensitivity: "mutating",
  inputSchema: {
    type: "object",
    properties: {
      description: { type: "string" },
      hs_code: { type: "string" },
      origin: { type: "string" },
      destination: { type: "string" },
      fob_value_usd: { type: "number" },
      quantity: { type: "number" },
      qualifies: { type: "string", enum: ["yes", "no", "marginal"] },
      rule_applied: { type: "string" },
      confidence: { type: "number" }
    },
    required: ["description", "hs_code", "origin", "destination", "qualifies", "rule_applied"]
  },
  zod: CreateDeterminationInput,
  async handler(input, ctx) {
    const parsed = CreateDeterminationInput.parse(input);
    const t = lookupTariff(parsed.hs_code.slice(0, 4));
    const mfn = t?.mfnRate ?? 0;
    const afcfta = t?.afcftaRate ?? 0;
    const fob = parsed.fob_value_usd ?? 0;
    const savings = ((mfn - afcfta) * fob) / 100;
    const r = await saveDetermination({
      workspaceId: ctx.workspaceId,
      description: parsed.description,
      hsCode: parsed.hs_code,
      confidence: parsed.confidence,
      originCountry: parsed.origin.toUpperCase(),
      destinationCountry: parsed.destination.toUpperCase(),
      quantity: parsed.quantity,
      fobValueUsd: parsed.fob_value_usd,
      qualifies: parsed.qualifies,
      ruleApplied: parsed.rule_applied,
      mfnRate: mfn,
      afcftaRate: afcfta,
      savingsUsd: savings
    });
    audit({
      workspaceId: ctx.workspaceId,
      action: "determination.created",
      actor: `agent:${ctx.agentName}`,
      target: r.id,
      metadata: { agentId: ctx.agentId, savingsUsd: savings }
    });
    return { ok: true, output: { determination_id: r.id, savings_usd: Math.round(savings * 100) / 100 } };
  }
};

// =============================================================================
// create_certificate
// =============================================================================
const CreateCertificateInput = z.object({
  determination_id: z.string().min(1),
  hs_code: z.string().min(4),
  origin: z.string().length(2),
  destination: z.string().length(2),
  exporter_name: z.string().min(1).max(200),
  consignee_name: z.string().min(1).max(200),
  exporter_address: z.string().max(500).optional(),
  consignee_address: z.string().max(500).optional()
});
const createCertificateTool: ToolDefinition = {
  name: "create_certificate",
  description:
    "Issue an AfCFTA Certificate of Origin PDF for an existing determination. Only do this for qualifying or marginal determinations. ALWAYS confirm the exporter and consignee before calling.",
  sensitivity: "mutating",
  inputSchema: {
    type: "object",
    properties: {
      determination_id: { type: "string" },
      hs_code: { type: "string" },
      origin: { type: "string" },
      destination: { type: "string" },
      exporter_name: { type: "string" },
      consignee_name: { type: "string" },
      exporter_address: { type: "string" },
      consignee_address: { type: "string" }
    },
    required: ["determination_id", "hs_code", "origin", "destination", "exporter_name", "consignee_name"]
  },
  zod: CreateCertificateInput,
  async handler(input, ctx) {
    const parsed = CreateCertificateInput.parse(input);
    const r = await saveCertificate({
      workspaceId: ctx.workspaceId,
      determinationId: parsed.determination_id,
      hsCode: parsed.hs_code,
      originCountry: parsed.origin.toUpperCase(),
      destinationCountry: parsed.destination.toUpperCase(),
      exporterName: parsed.exporter_name,
      exporterAddress: parsed.exporter_address,
      consigneeName: parsed.consignee_name,
      consigneeAddress: parsed.consignee_address
    });
    audit({
      workspaceId: ctx.workspaceId,
      action: "certificate.issued",
      actor: `agent:${ctx.agentName}`,
      target: r.id,
      metadata: { agentId: ctx.agentId, reference: r.reference }
    });
    void dispatch({
      workspaceId: ctx.workspaceId,
      event: "certificate.issued",
      object: { id: r.id, reference: r.reference, issued_by_agent: ctx.agentId }
    });
    return { ok: true, output: { certificate_id: r.id, reference: r.reference, pdf_url: r.pdfUrl } };
  }
};

// =============================================================================
// list_determinations
// =============================================================================
const ListDeterminationsInput = z.object({ limit: z.number().int().min(1).max(50).optional() });
const listDeterminationsTool: ToolDefinition = {
  name: "list_determinations",
  description: "List the workspace's most recent determinations. Useful for compliance review agents that want to find low-confidence or marginal rows to revisit.",
  sensitivity: "read_only",
  inputSchema: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 50 } } },
  zod: ListDeterminationsInput,
  async handler(input, ctx) {
    const { limit } = ListDeterminationsInput.parse(input ?? {});
    const rows = await listDeterminations(ctx.workspaceId, limit ?? 20);
    return { ok: true, output: { determinations: rows } };
  }
};

// =============================================================================
// list_certificates
// =============================================================================
const ListCertificatesInput = z.object({ limit: z.number().int().min(1).max(50).optional() });
const listCertificatesTool: ToolDefinition = {
  name: "list_certificates",
  description: "List the workspace's most recent certificates.",
  sensitivity: "read_only",
  inputSchema: { type: "object", properties: { limit: { type: "integer", minimum: 1, maximum: 50 } } },
  zod: ListCertificatesInput,
  async handler(input, ctx) {
    const { limit } = ListCertificatesInput.parse(input ?? {});
    const rows = await listCertificates(ctx.workspaceId, limit ?? 20);
    return { ok: true, output: { certificates: rows } };
  }
};

// =============================================================================
// get_workspace_stats
// =============================================================================
const getWorkspaceStatsTool: ToolDefinition = {
  name: "get_workspace_stats",
  description: "Get aggregate metrics for the workspace — total determinations, certificates, qualifying rate, total AfCFTA savings.",
  sensitivity: "read_only",
  inputSchema: { type: "object", properties: {} },
  zod: z.object({}),
  async handler(_input, ctx) {
    const s = await workspaceStats(ctx.workspaceId);
    return { ok: true, output: s };
  }
};

// =============================================================================
// notify_user
// =============================================================================
const NotifyUserInput = z.object({
  kind: z.enum(["determination.marginal", "certificate.issued", "system.update", "kyb.rejected"]).default("system.update"),
  title: z.string().min(1).max(140),
  body: z.string().max(500).optional(),
  target: z.string().max(200).optional()
});
const notifyUserTool: ToolDefinition = {
  name: "notify_user",
  description:
    "Send an in-product notification to the workspace. Use sparingly — only for actionable insights the user should review. Optionally include a `target` path for a deep link (e.g. /dashboard/determinations).",
  sensitivity: "mutating",
  inputSchema: {
    type: "object",
    properties: {
      kind: { type: "string", enum: ["determination.marginal", "certificate.issued", "system.update", "kyb.rejected"] },
      title: { type: "string" },
      body: { type: "string" },
      target: { type: "string" }
    },
    required: ["title"]
  },
  zod: NotifyUserInput,
  async handler(input, ctx) {
    const parsed = NotifyUserInput.parse(input);
    notify({
      workspaceId: ctx.workspaceId,
      kind: parsed.kind,
      title: `[${ctx.agentName}] ${parsed.title}`,
      body: parsed.body,
      target: parsed.target
    });
    return { ok: true, output: { delivered: true } };
  }
};

// =============================================================================
// request_approval
// =============================================================================
const RequestApprovalInput = z.object({
  question: z.string().min(1).max(500),
  payload: z.record(z.string(), z.unknown()).optional()
});
const requestApprovalTool: ToolDefinition = {
  name: "request_approval",
  description:
    "Pause the run and ask a human to approve before continuing. Use this whenever you're about to take an action with material consequences (e.g. revoking a certificate, sending an email to a counterparty, issuing a large certificate). The engine will surface an approval card; once the user approves or declines, the run resumes.",
  sensitivity: "read_only",
  inputSchema: {
    type: "object",
    properties: {
      question: { type: "string", description: "What do you want the user to approve?" },
      payload: { type: "object", description: "Context the human needs to decide", additionalProperties: true }
    },
    required: ["question"]
  },
  zod: RequestApprovalInput,
  async handler() {
    // The engine intercepts this tool — see lib/agents/engine.ts. The handler
    // is never actually invoked, but we register the schema so Claude can
    // call it consistently.
    throw new Error("request_approval is intercepted by the engine");
  }
};

// Updates the in-place determination of a non-mutating helper that lists
// recent determinations of low confidence. Convenient for the
// Compliance Sentry agent.
const FindLowConfidenceInput = z.object({
  threshold: z.number().min(0).max(1).default(0.7),
  limit: z.number().int().min(1).max(50).default(10)
});
const findLowConfidenceTool: ToolDefinition = {
  name: "find_low_confidence_determinations",
  description: "Find recent determinations whose classification confidence is below a threshold (default 0.7). Returns up to `limit` rows for review.",
  sensitivity: "read_only",
  inputSchema: {
    type: "object",
    properties: {
      threshold: { type: "number", minimum: 0, maximum: 1 },
      limit: { type: "integer", minimum: 1, maximum: 50 }
    }
  },
  zod: FindLowConfidenceInput,
  async handler(input, ctx) {
    const { threshold, limit } = FindLowConfidenceInput.parse(input ?? {});
    const rows = await listDeterminations(ctx.workspaceId, 200);
    const flagged = rows.filter((r) => r.confidence < threshold).slice(0, limit);
    return { ok: true, output: { count: flagged.length, threshold, determinations: flagged } };
  }
};

// =============================================================================
// Registry
// =============================================================================
export const TOOLS: Record<string, ToolDefinition> = {
  classify: classifyTool,
  determine_origin: determineOriginTool,
  lookup_tariff: lookupTariffTool,
  list_determinations: listDeterminationsTool,
  list_certificates: listCertificatesTool,
  get_workspace_stats: getWorkspaceStatsTool,
  find_low_confidence_determinations: findLowConfidenceTool,
  create_determination: createDeterminationTool,
  create_certificate: createCertificateTool,
  notify_user: notifyUserTool,
  request_approval: requestApprovalTool
};

export function toolsForAgent(allowed: string[]): ToolDefinition[] {
  return allowed.map((n) => TOOLS[n]).filter(Boolean);
}
