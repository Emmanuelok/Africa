import { desc, eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { getDb, schema } from "@/lib/db/client";
import { log } from "@/lib/log";
import { putCertificatePdf } from "@/lib/blob/store";
import {
  DEMO_DETERMINATIONS,
  DEMO_CERTIFICATES,
  type DemoDetermination,
  type DemoCertificate
} from "@/lib/data/demo-store";

export type SaveDeterminationInput = {
  workspaceId: string;
  description: string;
  hsCode: string;
  confidence?: number;
  reasoning?: string;
  originCountry: string;
  destinationCountry: string;
  quantity?: number;
  fobValueUsd?: number;
  qualifies: "yes" | "no" | "marginal";
  ruleApplied: string;
  mfnRate?: number;
  afcftaRate?: number;
  savingsUsd?: number;
};

export async function saveDetermination(input: SaveDeterminationInput): Promise<{ id: string }> {
  const db = getDb();
  if (!db) {
    // In demo mode we don't persist — return a synthetic id so the UI flow continues.
    return { id: `det_demo_${randomBytes(4).toString("hex")}` };
  }
  const num = (v: number | undefined) => (v === undefined ? null : v.toString());
  const rows = await db
    .insert(schema.determinations)
    .values({
      workspaceId: input.workspaceId === "demo-workspace" ? null : input.workspaceId,
      description: input.description,
      hsCode: input.hsCode,
      confidence: num(input.confidence),
      reasoning: input.reasoning,
      originCountry: input.originCountry,
      destinationCountry: input.destinationCountry,
      quantity: num(input.quantity),
      fobValueUsd: num(input.fobValueUsd),
      qualifies: input.qualifies,
      ruleApplied: input.ruleApplied,
      mfnRate: num(input.mfnRate),
      afcftaRate: num(input.afcftaRate),
      savingsUsd: num(input.savingsUsd)
    })
    .returning({ id: schema.determinations.id });
  return { id: rows[0].id };
}

export async function listDeterminations(workspaceId: string, limit = 50): Promise<DemoDetermination[]> {
  const db = getDb();
  if (!db || workspaceId === "demo-workspace") return DEMO_DETERMINATIONS;

  const rows = await db
    .select()
    .from(schema.determinations)
    .where(eq(schema.determinations.workspaceId, workspaceId))
    .orderBy(desc(schema.determinations.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    description: r.description,
    hsCode: r.hsCode ?? "",
    confidence: Number(r.confidence ?? 0),
    originCountry: r.originCountry,
    destinationCountry: r.destinationCountry,
    quantity: Number(r.quantity ?? 0),
    fobValueUsd: Number(r.fobValueUsd ?? 0),
    qualifies: (r.qualifies as "yes" | "no" | "marginal") ?? "yes",
    ruleApplied: r.ruleApplied ?? "",
    mfnRate: Number(r.mfnRate ?? 0),
    afcftaRate: Number(r.afcftaRate ?? 0),
    savingsUsd: Number(r.savingsUsd ?? 0),
    createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt as unknown as string)).toISOString()
  }));
}

export type DeterminationDetail = DemoDetermination & { reasoning: string | null };

// Single determination scoped to the workspace, with the stored reasoning.
export async function getDetermination(workspaceId: string, id: string): Promise<DeterminationDetail | null> {
  const db = getDb();
  if (!db || workspaceId === "demo-workspace" || id.startsWith("det_demo_")) {
    const demo = DEMO_DETERMINATIONS.find((d) => d.id === id) ?? null;
    return demo ? { ...demo, reasoning: null } : null;
  }
  const rows = await db
    .select()
    .from(schema.determinations)
    .where(eq(schema.determinations.id, id))
    .limit(1);
  const r = rows[0];
  if (!r || r.workspaceId !== workspaceId) return null;
  return {
    id: r.id,
    description: r.description,
    hsCode: r.hsCode ?? "",
    confidence: Number(r.confidence ?? 0),
    originCountry: r.originCountry,
    destinationCountry: r.destinationCountry,
    quantity: Number(r.quantity ?? 0),
    fobValueUsd: Number(r.fobValueUsd ?? 0),
    qualifies: (r.qualifies as "yes" | "no" | "marginal") ?? "yes",
    ruleApplied: r.ruleApplied ?? "",
    mfnRate: Number(r.mfnRate ?? 0),
    afcftaRate: Number(r.afcftaRate ?? 0),
    savingsUsd: Number(r.savingsUsd ?? 0),
    reasoning: r.reasoning ?? null,
    createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt as unknown as string)).toISOString()
  };
}

export function generateCertReference(): string {
  // AFCFTA-<8 alphanumerics> e.g. AFCFTA-K9P4XJ02
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return `AFCFTA-${out}`;
}

export type SaveCertificateInput = {
  workspaceId: string;
  determinationId: string;
  hsCode: string;
  originCountry: string;
  destinationCountry: string;
  exporterName: string;
  exporterAddress?: string;
  consigneeName: string;
  consigneeAddress?: string;
};

export async function saveCertificate(input: SaveCertificateInput): Promise<{ id: string; reference: string; pdfUrl: string | null }> {
  const reference = generateCertReference();
  const db = getDb();
  if (!db || input.workspaceId === "demo-workspace") {
    return { id: `cert_demo_${randomBytes(4).toString("hex")}`, reference, pdfUrl: null };
  }
  const rows = await db
    .insert(schema.certificates)
    .values({
      workspaceId: input.workspaceId,
      determinationId: input.determinationId.startsWith("det_demo_") ? null : input.determinationId,
      reference,
      exporterName: input.exporterName,
      exporterAddress: input.exporterAddress,
      consigneeName: input.consigneeName,
      consigneeAddress: input.consigneeAddress,
      qrVerificationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa"}/verify/${reference}`
    })
    .returning({ id: schema.certificates.id, reference: schema.certificates.reference });

  // Render + persist the PDF to Vercel Blob in the background. Failure is
  // non-fatal — the on-demand /api/certificates/[id]/pdf route always works.
  void (async () => {
    try {
      const { renderCertificatePdf } = await import("@/lib/pdf/certificate");
      const det = input.determinationId.startsWith("det_demo_")
        ? null
        : (await db
            .select()
            .from(schema.determinations)
            .where(eq(schema.determinations.id, input.determinationId))
            .limit(1))[0];

      // Load workspace branding (only applied if plan === forwarder)
      const wsRows = await db
        .select()
        .from(schema.workspaces)
        .where(eq(schema.workspaces.id, input.workspaceId))
        .limit(1);
      const ws = wsRows[0];
      const useBranding = ws?.plan === "forwarder";

      const pdfBuf = await renderCertificatePdf({
        reference,
        issuedAt: new Date().toISOString(),
        hsCode: det?.hsCode ?? input.hsCode,
        productDescription: det?.description ?? "—",
        originCountry: input.originCountry,
        destinationCountry: input.destinationCountry,
        exporter: { name: input.exporterName, address: input.exporterAddress },
        consignee: { name: input.consigneeName, address: input.consigneeAddress },
        shipment: {
          quantity: det?.quantity ? Number(det.quantity) : undefined,
          fobValueUsd: det?.fobValueUsd ? Number(det.fobValueUsd) : undefined,
          unit: "kg"
        },
        originCriterion: det?.ruleApplied ?? "Wholly Obtained",
        preferentialRate: det?.afcftaRate ? Number(det.afcftaRate) : undefined,
        brand: useBranding && ws?.brandName ? {
          name: ws.brandName,
          logoUrl: ws.brandLogoUrl,
          primaryColor: ws.brandPrimaryColor,
          footerNote: ws.brandFooterNote
        } : undefined
      });
      const pdfUrl = await putCertificatePdf(reference, pdfBuf);
      if (pdfUrl) {
        await db
          .update(schema.certificates)
          .set({ pdfUrl })
          .where(eq(schema.certificates.id, rows[0].id));
      }
    } catch (err) {
      log.warn({ err, reference }, "background PDF render failed");
    }
  })();

  return { id: rows[0].id, reference: rows[0].reference, pdfUrl: null };
}

export async function listCertificates(workspaceId: string, limit = 50): Promise<DemoCertificate[]> {
  const db = getDb();
  if (!db || workspaceId === "demo-workspace") return DEMO_CERTIFICATES;

  const rows = await db
    .select()
    .from(schema.certificates)
    .where(eq(schema.certificates.workspaceId, workspaceId))
    .orderBy(desc(schema.certificates.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    determinationId: r.determinationId ?? "",
    hsCode: "",
    originCountry: "",
    destinationCountry: "",
    exporterName: r.exporterName ?? "",
    consigneeName: r.consigneeName ?? "",
    endorsedByAuthority: r.endorsedByAuthority,
    revoked: !!r.revokedAt,
    createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt as unknown as string)).toISOString()
  }));
}

export type WorkspaceStats = {
  determinations: number;
  certificates: number;
  endorsedCertificates: number;
  qualifying: number;
  totalSavingsUsd: number;
  totalFobUsd: number;
};

// Single round-trip aggregates for the overview tiles. Replaces computing
// metrics off a truncated list (which only reflected the latest few rows).
export async function workspaceStats(workspaceId: string): Promise<WorkspaceStats> {
  const db = getDb();

  if (!db || workspaceId === "demo-workspace") {
    const dets = DEMO_DETERMINATIONS;
    const certs = DEMO_CERTIFICATES;
    return {
      determinations: dets.length,
      certificates: certs.length,
      endorsedCertificates: certs.filter((c) => c.endorsedByAuthority).length,
      qualifying: dets.filter((d) => d.qualifies === "yes").length,
      totalSavingsUsd: dets.reduce((s, d) => s + d.savingsUsd, 0),
      totalFobUsd: dets.reduce((s, d) => s + d.fobValueUsd, 0)
    };
  }

  const [detAgg, certAgg] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
        qualifying: sql<number>`count(*) filter (where ${schema.determinations.qualifies} = 'yes')::int`,
        savings: sql<number>`coalesce(sum(${schema.determinations.savingsUsd}), 0)::float8`,
        fob: sql<number>`coalesce(sum(${schema.determinations.fobValueUsd}), 0)::float8`
      })
      .from(schema.determinations)
      .where(eq(schema.determinations.workspaceId, workspaceId)),
    db
      .select({
        count: sql<number>`count(*)::int`,
        endorsed: sql<number>`count(*) filter (where ${schema.certificates.endorsedByAuthority} = true)::int`
      })
      .from(schema.certificates)
      .where(eq(schema.certificates.workspaceId, workspaceId))
  ]);

  return {
    determinations: detAgg[0]?.count ?? 0,
    certificates: certAgg[0]?.count ?? 0,
    endorsedCertificates: certAgg[0]?.endorsed ?? 0,
    qualifying: detAgg[0]?.qualifying ?? 0,
    totalSavingsUsd: detAgg[0]?.savings ?? 0,
    totalFobUsd: detAgg[0]?.fob ?? 0
  };
}
