import { NextResponse } from "next/server";
import { classifyWithAI } from "@/lib/ai/classify";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "classify");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429, headers }
    );
  }

  try {
    const body = await req.json();
    const description = String(body?.description ?? "").trim();
    if (!description) {
      return NextResponse.json({ error: "description is required" }, { status: 400, headers });
    }
    if (description.length > 2000) {
      return NextResponse.json({ error: "description too long (max 2000 chars)" }, { status: 400, headers });
    }

    const result = await classifyWithAI(description);
    return NextResponse.json(result, { headers });
  } catch (err) {
    console.error("[/api/classify]", err);
    return NextResponse.json({ error: "Classification failed" }, { status: 500, headers });
  }
}
