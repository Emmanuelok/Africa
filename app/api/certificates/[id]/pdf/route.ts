import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { renderCertificatePdf, type CertificateData } from "@/lib/pdf/certificate";
import { DEMO_CERTIFICATES, DEMO_DETERMINATIONS } from "@/lib/data/demo-store";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const data = await resolveCertificate(id);
  if (!data) {
    return new Response("Certificate not found", { status: 404 });
  }

  const buffer = await renderCertificatePdf(data);
  const arr = new Uint8Array(buffer);

  return new Response(arr, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.reference}.pdf"`,
      "Cache-Control": "private, no-store"
    }
  });
}

async function resolveCertificate(id: string): Promise<CertificateData | null> {
  // Demo lookup — works without a DB so the dashboard "View / print" links work.
  if (id.startsWith("cert_demo_") || id.startsWith("AFCFTA-")) {
    const demo = DEMO_CERTIFICATES.find(
      (c) => c.id === id || c.reference === id
    );
    if (demo) {
      const det = DEMO_DETERMINATIONS.find((d) => d.id === demo.determinationId);
      return {
        reference: demo.reference,
        issuedAt: demo.createdAt,
        hsCode: demo.hsCode,
        productDescription: det?.description ?? "—",
        originCountry: demo.originCountry,
        destinationCountry: demo.destinationCountry,
        exporter: { name: demo.exporterName },
        consignee: { name: demo.consigneeName },
        shipment: {
          quantity: det?.quantity,
          unit: "kg",
          fobValueUsd: det?.fobValueUsd
        },
        originCriterion: det?.ruleApplied ?? "Wholly Obtained",
        preferentialRate: det?.afcftaRate,
        endorsedByAuthority: demo.endorsedByAuthority
      };
    }
  }

  const db = getDb();
  if (!db) return null;

  const certs = await db
    .select()
    .from(schema.certificates)
    .where(eq(schema.certificates.id, id))
    .limit(1);
  const cert = certs[0];
  if (!cert) return null;

  let det: typeof schema.determinations.$inferSelect | undefined;
  if (cert.determinationId) {
    const dets = await db
      .select()
      .from(schema.determinations)
      .where(eq(schema.determinations.id, cert.determinationId))
      .limit(1);
    det = dets[0];
  }

  return {
    reference: cert.reference,
    issuedAt: cert.createdAt.toISOString(),
    hsCode: det?.hsCode ?? "—",
    productDescription: det?.description ?? "—",
    originCountry: det?.originCountry ?? "",
    destinationCountry: det?.destinationCountry ?? "",
    exporter: {
      name: cert.exporterName ?? "—",
      address: cert.exporterAddress ?? undefined
    },
    consignee: {
      name: cert.consigneeName ?? "—",
      address: cert.consigneeAddress ?? undefined
    },
    shipment: {
      quantity: det?.quantity ? Number(det.quantity) : undefined,
      unit: "kg",
      fobValueUsd: det?.fobValueUsd ? Number(det.fobValueUsd) : undefined
    },
    originCriterion: det?.ruleApplied ?? "Wholly Obtained",
    preferentialRate: det?.afcftaRate ? Number(det.afcftaRate) : undefined,
    endorsedByAuthority: cert.endorsedByAuthority
  };
}
