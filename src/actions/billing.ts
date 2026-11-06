'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient, getMyStore } from '@/lib/supabase/server';
import { createPayment, paymentsConfigured } from '@/lib/geniuspay';
import { PRIX_ABONNEMENT } from '@/lib/subscription';

export const PAY_COOKIE = 'kitala_pay_ref';

/** Crée le paiement chez GeniusPay puis envoie le commerçant sur la page de paiement. */
export async function startPaymentAction() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect('/login');
  const store = await getMyStore();
  if (!store) redirect('/dashboard');
  if (!paymentsConfigured()) redirect('/dashboard/paiement?e=config');

  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'kitala-delta.vercel.app';
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${host}`;

  let url: string;
  try {
    const p = await createPayment({
      amount: PRIX_ABONNEMENT,
      description: `Abonnement Kitala – ${store.nom} (1 mois)`,
      successUrl: `${origin}/dashboard/paiement`,
      errorUrl: `${origin}/dashboard/paiement?e=annule`,
      customer: { name: store.nom, email: store.email, phone: `+${store.whatsapp.replace(/\D/g, '')}` },
      metadata: { store_id: store.id },
    });
    cookies().set(PAY_COOKIE, p.reference, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 });
    url = p.url;
  } catch {
    redirect('/dashboard/paiement?e=erreur');
  }
  redirect(url);
}
