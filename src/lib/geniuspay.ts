import 'server-only';
import { createHmac } from 'node:crypto';

const BASE = 'https://geniuspay.ci/api/v1/merchant';

export const paymentsConfigured = () => Boolean(process.env.GENIUSPAY_API_KEY && process.env.GENIUSPAY_API_SECRET && process.env.PAYMENT_PROOF_SECRET);

function headers() {
  return {
    'X-API-Key': process.env.GENIUSPAY_API_KEY ?? '',
    'X-API-Secret': process.env.GENIUSPAY_API_SECRET ?? '',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

type Raw = { data?: Record<string, unknown>; message?: string } & Record<string, unknown>;

export async function createPayment(p: {
  amount: number; description: string; successUrl: string; errorUrl: string;
  customer: { name: string; email: string; phone: string }; metadata: Record<string, string>;
}): Promise<{ reference: string; url: string }> {
  const res = await fetch(`${BASE}/payments`, {
    method: 'POST', headers: headers(), cache: 'no-store', signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      amount: p.amount, currency: 'XOF', description: p.description,
      customer: p.customer, success_url: p.successUrl, error_url: p.errorUrl, metadata: p.metadata,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as Raw;
  const d = (json.data ?? json) as Record<string, unknown>;
  const url = String(d.checkout_url ?? d.payment_url ?? '');
  const reference = String(d.reference ?? '');
  if (!res.ok || !url || !reference) {
    console.error('[kitala] GeniusPay createPayment', res.status, JSON.stringify(json).slice(0, 300));
    throw new Error('PAYMENT_CREATE_FAILED');
  }
  return { reference, url };
}

export type PaymentInfo = { reference: string; status: string; amount: number; storeId: string | null };

export async function getPayment(reference: string): Promise<PaymentInfo | null> {
  const res = await fetch(`${BASE}/payments/${encodeURIComponent(reference)}`, { headers: headers(), cache: 'no-store', signal: AbortSignal.timeout(15_000) });
  if (!res.ok) { console.error('[kitala] GeniusPay getPayment', res.status); return null; }
  const json = (await res.json().catch(() => ({}))) as Raw;
  const d = (json.data ?? json) as Record<string, unknown>;
  const meta = (d.metadata ?? {}) as Record<string, unknown>;
  return {
    reference: String(d.reference ?? reference),
    status: String(d.status ?? '').toLowerCase(),
    amount: Number(d.amount ?? 0),
    storeId: meta.store_id ? String(meta.store_id) : null,
  };
}

/** Preuve vérifiée par la base : seul le serveur (qui connaît la clé) peut activer un abonnement. */
export const proofFor = (storeId: string, reference: string, amount: number) =>
  createHmac('sha256', process.env.PAYMENT_PROOF_SECRET ?? '').update(`${storeId}|${reference}|${amount}`).digest('hex');
