import { put, head, del } from "@vercel/blob";

// Vercel Blob is auto-configured on Vercel deployments — the SDK reads
// BLOB_READ_WRITE_TOKEN from the env. Locally and on other platforms it's a
// no-op unless the token is set. All helpers return null on miss so callers
// can fall back to live re-rendering.

function isConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function putCertificatePdf(reference: string, pdf: Buffer): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const result = await put(`certificates/${reference}.pdf`, pdf, {
      access: "public",
      contentType: "application/pdf",
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365 // 1 year — references are immutable
    });
    return result.url;
  } catch (err) {
    console.warn("[blob] putCertificatePdf failed:", err);
    return null;
  }
}

export async function certificatePdfUrl(reference: string): Promise<string | null> {
  if (!isConfigured()) return null;
  try {
    const info = await head(`certificates/${reference}.pdf`);
    return info.url;
  } catch {
    return null;
  }
}

export async function deleteCertificatePdf(reference: string): Promise<void> {
  if (!isConfigured()) return;
  try {
    await del(`certificates/${reference}.pdf`);
  } catch (err) {
    console.warn("[blob] deleteCertificatePdf failed:", err);
  }
}
