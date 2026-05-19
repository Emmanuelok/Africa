// Smile Identity — pan-African KYC/KYB provider with NIN (Nigeria), BVN
// (Nigeria), KRA pin (Kenya), TIN (multiple), and business-registry checks
// across 50+ African countries.
// https://docs.smileidentity.com/
//
// Lightweight fetch wrapper — no SDK needed for the JSON API.

const BASE_URL = process.env.SMILE_ENVIRONMENT === "live"
  ? "https://api.smileidentity.com/v1"
  : "https://testapi.smileidentity.com/v1";

export type KybStatus = "not_started" | "pending" | "verified" | "rejected";

export function isSmileConfigured() {
  return !!(process.env.SMILE_API_KEY && process.env.SMILE_PARTNER_ID);
}

// Business types Smile supports for AfCFTA-relevant African economies.
export const BUSINESS_TYPES = [
  { code: "co", label: "Limited liability company" },
  { code: "sp", label: "Sole proprietorship" },
  { code: "it", label: "Incorporated trustees / cooperative" },
  { code: "bn", label: "Business name / partnership" }
] as const;

export const SUPPORTED_COUNTRIES = ["NG", "KE", "GH", "ZA", "UG", "TZ", "RW", "CI"] as const;

export type BusinessVerificationInput = {
  workspaceId: string;
  country: (typeof SUPPORTED_COUNTRIES)[number];
  businessType: (typeof BUSINESS_TYPES)[number]["code"];
  registrationNumber: string; // e.g. NG: RC number, KE: P051xxx
  businessName: string;
  beneficialOwners?: Array<{ name: string; idType: string; idNumber: string }>;
};

export type VerificationResult = {
  status: KybStatus;
  smileJobId?: string;
  partnerParams?: { job_id: string; user_id: string };
  resultText?: string;
  raw?: unknown;
};

// Submits a business verification job. In production this is async — Smile
// posts the result back to your configured callback URL after a few minutes
// to several hours. We return the job id so it can be polled or matched up
// when the webhook fires.
export async function submitBusinessVerification(
  input: BusinessVerificationInput
): Promise<VerificationResult> {
  if (!isSmileConfigured()) {
    return { status: "not_started", resultText: "Smile Identity not configured" };
  }

  const jobId = `sokoni-${input.workspaceId}-${Date.now()}`;
  const userId = `ws-${input.workspaceId}`;

  try {
    const res = await fetch(`${BASE_URL}/business_verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SMILE_API_KEY}`
      },
      body: JSON.stringify({
        partner_id: process.env.SMILE_PARTNER_ID,
        partner_params: { job_id: jobId, user_id: userId, job_type: 7 },
        country: input.country,
        id_type: input.businessType.toUpperCase(),
        id_number: input.registrationNumber,
        business_name: input.businessName,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://sokoni.africa"}/api/kyb/callback`
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        status: "rejected",
        resultText: data?.error ?? data?.message ?? `Smile API ${res.status}`,
        raw: data
      };
    }
    return {
      status: "pending",
      smileJobId: data?.smile_job_id,
      partnerParams: { job_id: jobId, user_id: userId },
      raw: data
    };
  } catch (err) {
    return {
      status: "rejected",
      resultText: err instanceof Error ? err.message : "Verification request failed"
    };
  }
}

// Map Smile's job-status codes to our internal taxonomy.
// 0 = approved, 1 = rejected, 1xxx = pending, others = unknown.
export function statusFromCode(code: number | string): KybStatus {
  const n = Number(code);
  if (n === 0) return "verified";
  if (n === 1) return "rejected";
  if (n >= 1000 && n < 2000) return "pending";
  return "pending";
}
