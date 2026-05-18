import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { saveDetermination, listDeterminations } from "@/lib/data/determinations";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";

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
