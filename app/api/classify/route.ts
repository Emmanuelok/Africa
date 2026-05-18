import { NextResponse } from "next/server";
import { classifyWithAI } from "@/lib/ai/classify";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const description = String(body?.description ?? "").trim();
    if (!description) {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }
    if (description.length > 2000) {
      return NextResponse.json({ error: "description too long (max 2000 chars)" }, { status: 400 });
    }

    const result = await classifyWithAI(description);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/classify]", err);
    return NextResponse.json({ error: "Classification failed" }, { status: 500 });
  }
}
