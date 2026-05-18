import { NextResponse } from "next/server";
import { authenticateApiKey, recordUsage } from "@/lib/api/v1-auth";
import { classifyWithAI } from "@/lib/ai/classify";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const t0 = Date.now();
  const auth = await authenticateApiKey(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rl = await rateLimit(`key:${auth.keyId}`, "api");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/classify", statusCode: 429, durationMs: Date.now() - t0 });
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers });
  }

  try {
    const body = await req.json();
    const description = String(body?.description ?? "").trim();
    if (!description) {
      recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/classify", statusCode: 400, durationMs: Date.now() - t0 });
      return NextResponse.json({ error: { code: "invalid_request", message: "description is required" } }, { status: 400, headers });
    }

    const result = await classifyWithAI(description);
    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/classify", statusCode: 200, durationMs: Date.now() - t0 });
    return NextResponse.json(
      {
        hs_code: result.hsPrefix,
        description: result.description,
        confidence: result.confidence,
        reasoning: "reasoning" in result ? result.reasoning : undefined,
        source: result.source,
        alternates: result.alternates ?? []
      },
      { headers }
    );
  } catch (err) {
    console.error("[/api/v1/classify]", err);
    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/classify", statusCode: 500, durationMs: Date.now() - t0 });
    return NextResponse.json({ error: { code: "internal_error", message: "Classification failed" } }, { status: 500, headers });
  }
}
