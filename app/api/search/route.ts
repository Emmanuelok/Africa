import { NextResponse } from "next/server";
import { search } from "@/lib/search/index";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Math.min(50, Number(url.searchParams.get("limit") ?? 12));
  const results = search(q, limit);
  return NextResponse.json(
    { query: q, results },
    {
      headers: {
        // Aggressive edge caching — the corpus is static.
        "Cache-Control": "public, max-age=60, s-maxage=300"
      }
    }
  );
}
