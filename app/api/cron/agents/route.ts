import { NextResponse } from "next/server";
import { runDueAgents } from "@/lib/agents/triggers";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

// Runs every 5 minutes (vercel.json). Executes scheduled agents whose nextRunAt
// has passed and drains any queued event-triggered runs.
export async function GET(req: Request) {
  if (!authorize(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const summary = await runDueAgents();
  return NextResponse.json({ ranAt: new Date().toISOString(), ...summary });
}
