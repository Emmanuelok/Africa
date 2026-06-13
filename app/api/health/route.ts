import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/server/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness + dependency probe for Vercel monitoring, Better Stack, uptime
// tools. Returns 503 when any configured dependency check fails. Use ?deep=1
// to include the Anthropic reachability probe.
export async function GET(req: Request) {
  const deep = new URL(req.url).searchParams.get("deep") === "1";
  const report = await runHealthChecks(deep);
  return NextResponse.json(report, {
    status: report.status === "degraded" ? 503 : 200,
    headers: { "Cache-Control": "no-store" }
  });
}
