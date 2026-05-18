// Flutterwave — pan-African payments across 30+ countries, supports mobile money
// (M-Pesa, MTN MoMo, Airtel Money), cards, bank transfers.

const BASE = "https://api.flutterwave.com/v3";

function key() {
  return process.env.FLUTTERWAVE_SECRET_KEY;
}

export function isFlutterwaveConfigured() {
  return !!key();
}

type CreatePaymentArgs = {
  txRef: string;
  amount: number;
  currency: string; // NGN, KES, GHS, UGX, ZMW, RWF, TZS, XAF, XOF, ZAR, USD, etc.
  email: string;
  name?: string;
  phone?: string;
  redirectUrl?: string;
  meta?: Record<string, unknown>;
};

export async function createPayment(args: CreatePaymentArgs) {
  const k = key();
  if (!k) throw new Error("Flutterwave not configured");

  const res = await fetch(`${BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${k}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tx_ref: args.txRef,
      amount: args.amount,
      currency: args.currency,
      redirect_url: args.redirectUrl,
      customer: { email: args.email, name: args.name, phonenumber: args.phone },
      meta: args.meta,
      payment_options: "card,banktransfer,mobilemoneyghana,mpesa,mobilemoneyrwanda,mobilemoneyuganda,mobilemoneyzambia"
    })
  });
  if (!res.ok) throw new Error(`Flutterwave create failed: ${res.status}`);
  return (await res.json()) as {
    status: string;
    data: { link: string };
  };
}

export async function verifyTransaction(transactionId: string) {
  const k = key();
  if (!k) throw new Error("Flutterwave not configured");
  const res = await fetch(`${BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${k}` }
  });
  if (!res.ok) throw new Error(`Flutterwave verify failed: ${res.status}`);
  return res.json();
}
