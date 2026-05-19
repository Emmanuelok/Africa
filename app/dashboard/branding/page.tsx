import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/Badge";
import { BrandingForm } from "@/components/dashboard/BrandingForm";
import { getSessionUser } from "@/lib/server/session";
import { getDb, schema } from "@/lib/db/client";

export const metadata = { title: "Branding — Sokoni" };

export default async function BrandingPage() {
  const user = await getSessionUser();
  const db = getDb();

  let initial = { brandName: "", brandLogoUrl: "", brandPrimaryColor: "#b8401f", brandFooterNote: "" };
  if (db && !user.isDemo) {
    const rows = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, user.workspaceId))
      .limit(1);
    const ws = rows[0];
    if (ws) {
      initial = {
        brandName: ws.brandName ?? "",
        brandLogoUrl: ws.brandLogoUrl ?? "",
        brandPrimaryColor: ws.brandPrimaryColor ?? "#b8401f",
        brandFooterNote: ws.brandFooterNote ?? ""
      };
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold md:text-3xl">Branding</h1>
          <Badge tone="terracotta">Forwarder tier</Badge>
        </div>
        <p className="mt-1 text-sm text-ink-600">
          White-label Certificates of Origin. Your name, your logo, your colour palette — Sokoni
          stays in the background.
        </p>
      </header>

      <BrandingForm plan={user.plan} initial={initial} />
    </div>
  );
}
