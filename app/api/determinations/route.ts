import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { saveDetermination, listDeterminations } from "@/lib/data/determinations";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { dispatch } from "@/lib/webhooks/dispatch";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { notify } from "@/lib/server/notify";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "api");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers });
  }

  try {
    const user = await getSessionUser();
    const body = await req.json();

    const required = ["description", "hsCode", "originCountry", "destinationCountry", "qualifies", "ruleApplied"];
    for (const k of required) {
      if (!body?.[k]) return NextResponse.json({ error: `${k} is required` }, { status: 400, headers });
    }

    const result = await saveDetermination({
      workspaceId: user.workspaceId,
      description: String(body.description),
      hsCode: String(body.hsCode),
      confidence: numOrUndef(body.confidence),
      reasoning: body.reasoning ? String(body.reasoning) : undefined,
      originCountry: String(body.originCountry),
      destinationCountry: String(body.destinationCountry),
      quantity: numOrUndef(body.quantity),
      fobValueUsd: numOrUndef(body.fobValueUsd),
      qualifies: body.qualifies,
      ruleApplied: String(body.ruleApplied),
      mfnRate: numOrUndef(body.mfnRate),
      afcftaRate: numOrUndef(body.afcftaRate),
      savingsUsd: numOrUndef(body.savingsUsd)
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

function numOrUndef(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
