import Link from "next/link";
import { Download, FileCheck2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getSessionUser } from "@/lib/server/session";
import { listCertificates } from "@/lib/data/determinations";

export const metadata = { title: "Certificates — Sokoni" };

export default async function CertificatesPage() {
  const user = await getSessionUser();
  const items = await listCertificates(user.workspaceId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold md:text-3xl">Certificates of Origin</h1>
        <p className="mt-1 text-sm text-ink-600">
          AfCFTA Annex II Appendix I format. Accepted electronically across all 54 State Parties.
        </p>
      </header>

      {items.length === 0 ? (
        <Card className="text-center">
          <FileCheck2 className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 text-ink-600">No certificates yet.</p>
          <Link
            href="/afriorigin"
            className="mt-3 inline-block text-sm font-medium text-terracotta-700 hover:underline"
          >
            Start a shipment →
          </Link>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((c) => (
            <Card key={c.id} className="lift">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-xs font-medium tracking-wide text-ink-900">
                    {c.reference}
                  </div>
                  <div className="mt-1 truncate text-sm text-ink-700">
                    {c.exporterName}
                  </div>
                  <div className="truncate text-xs text-ink-500">→ {c.consigneeName}</div>
                </div>
                {c.endorsedByAuthority ? (
                  <Badge tone="savanna">Endorsed</Badge>
                ) : (
                  <Badge tone="warn">Pending</Badge>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 text-xs">
                <span className="text-ink-500">{formatDate(c.createdAt)}</span>
                <Link
                  href={`/afriorigin/certificate?ref=${c.reference}`}
                  className="inline-flex items-center gap-1 font-medium text-terracotta-700 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> View / print
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
