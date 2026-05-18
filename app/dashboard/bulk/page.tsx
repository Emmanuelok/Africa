import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { BulkClassifyForm } from "@/components/dashboard/BulkClassifyForm";
import { getSessionUser } from "@/lib/server/session";

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  pro: 50,
  bulk: 500,
  forwarder: 2000
};

export const metadata = { title: "Bulk classification — Sokoni" };

export default async function BulkPage() {
  const user = await getSessionUser();
  const limit = PLAN_LIMITS[user.plan] ?? PLAN_LIMITS.free;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold md:text-3xl">Bulk classification</h1>
          <Badge tone="terracotta">
            <Sparkles className="h-3 w-3" /> Bulk plan
          </Badge>
        </div>
        <p className="mt-1 text-sm text-ink-600">
          Drop a CSV of SKUs. We classify every row, run RoO, and return an enriched CSV with HS
          codes, qualification status, and AfCFTA savings.
        </p>
      </header>

      <BulkClassifyForm planLimit={limit} />

      <Card>
        <h2 className="font-semibold">How it works</h2>
        <ol className="mt-3 space-y-2 text-sm text-ink-700">
          <li><strong>1.</strong> Upload a CSV with columns: <code>description, origin, destination, quantity, fob_value_usd</code></li>
          <li><strong>2.</strong> We run each row through the same AI classifier the wizard uses (cached, so repeats are fast and cheap)</li>
          <li><strong>3.</strong> Each result is saved to your <Link href="/dashboard/determinations" className="text-terracotta-700 hover:underline">determinations history</Link> for follow-up</li>
          <li><strong>4.</strong> Download the enriched CSV with HS code, qualifies, rule, and savings columns added</li>
        </ol>
      </Card>
    </div>
  );
}
