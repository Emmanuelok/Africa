// Paystack — best for African card payments + bank transfers in NG, GH, KE, ZA.
// Lightweight wrapper around the REST API. Uses fetch — no SDK needed.

const BASE = "https://api.paystack.co";

function key() {
  return process.env.PAYSTACK_SECRET_KEY;
}

export function isPaystackConfigured() {
  return !!key();
}

type InitTxnArgs = {
  email: string;
  amountKobo: number; // Paystack uses minor units (kobo, pesewa, cents)
  currency?: "NGN" | "GHS" | "KES" | "ZAR" | "USD";
  callbackUrl?: string;
  plan?: string; // Paystack plan code, for subscriptions
  metadata?: Record<string, unknown>;
};

export async function initializeTransaction(args: InitTxnArgs) {
  const k = key();
  if (!k) throw new Error("Paystack not configured");

  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${k}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: args.email,
      amount: args.amountKobo,
      currency: args.currency ?? "NGN",
      callback_url: args.callbackUrl,
      plan: args.plan,
      metadata: args.metadata
    })
  });
  if (!res.ok) throw new Error(`Paystack init failed: ${res.status}`);
  return (await res.json()) as {
    status: boolean;
    data: { authorization_url: string; access_code: string; reference: string };
  };
}

export async function verifyTransaction(reference: string) {
  const k = key();
  if (!k) throw new Error("Paystack not configured");
  const res = await fetch(`${BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${k}` }
  });
  if (!res.ok) throw new Error(`Paystack verify failed: ${res.status}`);
  return res.json();
}
