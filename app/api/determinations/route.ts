import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import { saveDetermination, listDeterminations } from "@/lib/data/determinations";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { dispatch } from "@/lib/webhooks/dispatch";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { notify } from "@/lib/server/notify";
import { checkQuota } from "@/lib/server/quota";

export const runtime = "nodejs";

const Body = z.object({
  description: z.string().min(1).max(2000),
  hsCode: z.string().min(1).max(20),
  confidence: z.number().min(0).max(1).optional(),
  reasoning: z.string().max(4000).optional(),
  originCountry: z.string().length(2),
  destinationCountry: z.string().length(2),
  quantity: z.number().nonnegative().optional(),
  fobValueUsd: z.number().nonnegative().optional(),
  qualifies: z.enum(["yes", "no", "marginal"]),
  ruleApplied: z.string().min(1).max(200),
  mfnRate: z.number().min(0).max(100).optional(),
  afcftaRate: z.number().min(0).max(100).optional(),
  savingsUsd: z.number().optional()
});

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "api");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers });
  }

  try {
    const user = await getSessionUser();
    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input", issues: parsed.error.issues },
        { status: 400, headers }
      );
    }
    const body = parsed.data;

    const q = await checkQuota(user.workspaceId, user.plan, "determinationsPerMonth");
    if (!q.ok) {
      return NextResponse.json({ error: q.reason, used: q.used, limit: q.limit, code: "quota_exceeded" }, { status: 402, headers });
    }

    const result = await saveDetermination({
      workspaceId: user.workspaceId,
      description: body.description,
      hsCode: body.hsCode,
      confidence: body.confidence,
      reasoning: body.reasoning,
      originCountry: body.originCountry.toUpperCase(),
      destinationCountry: body.destinationCountry.toUpperCase(),
      quantity: body.quantity,
      fobValueUsd: body.fobValueUsd,
      qualifies: body.qualifies,
      ruleApplied: body.ruleApplied,
      mfnRate: body.mfnRate,
      afcftaRate: body.afcftaRate,
      savingsUsd: body.savingsUsd
    });

    const { ipAddress, userAgent } = ipAndUaFromRequest(req);
    audit({
      workspaceId: user.workspaceId,
      userId: user.id,
      action: "determination.created",
      target: result.id,
      metadata: { hsCode: body.hsCode, qualifies: body.qualifies, savingsUsd: body.savingsUsd },
      ipAddress,
      userAgent
    });

    void dispatch({
      workspaceId: user.workspaceId,
      event: "determination.created",
      object: {
        id: result.id,
        hs_code: String(body.hsCode),
        qualifies: body.qualifies,
        origin: body.originCountry,
        destination: body.destinationCountry,
        savings_usd: body.savingsUsd ?? 0
      }
    });
    if (body.qualifies === "yes" || body.qualifies === "marginal") {
      void dispatch({
        workspaceId: user.workspaceId,
        event: body.qualifies === "yes" ? "determination.qualified" : "determination.marginal",
        object: { id: result.id, hs_code: String(body.hsCode) }
      });
      if (body.qualifies === "marginal") {
        notify({
          workspaceId: user.workspaceId,
          userId: user.id,
          kind: "determination.marginal",
          title: `Marginal: ${String(body.description ?? "shipment").slice(0, 60)}`,
          body: `RVC close to threshold — review the rule applied for HS ${body.hsCode}.`,
          target: "/dashboard/determinations"
        });
      }
    } else {
      void dispatch({
        workspaceId: user.workspaceId,
        event: "determination.rejected",
        object: { id: result.id, hs_code: String(body.hsCode) }
      });
      notify({
        workspaceId: user.workspaceId,
        userId: user.id,
        kind: "determination.rejected",
        title: `Shipment did not qualify`,
        body: `HS ${body.hsCode} fails AfCFTA Rules of Origin. Consider sourcing more inputs within AfCFTA.`,
        target: "/dashboard/determinations"
      });
    }

    return NextResponse.json({ ok: true, ...result, isDemo: user.isDemo }, { headers });
  } catch (err) {
    console.error("[/api/determinations]", err);
    return NextResponse.json({ error: "Could not save determination" }, { status: 500, headers });
  }
}

export async function GET() {
  const user = await getSessionUser();
  const rows = await listDeterminations(user.workspaceId);
  return NextResponse.json({ determinations: rows });
}
