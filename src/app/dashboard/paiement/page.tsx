import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient, getMyStore } from '@/lib/supabase/server';
import { getPayment, paymentsConfigured, proofFor } from '@/lib/geniuspay';
import { startPaymentAction } from '@/actions/billing';
import { PRIX_ABONNEMENT, PAY_COOKIE } from '@/lib/subscription';

export const dynamic = 'force-dynamic';
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Brazzaville' });
const OK = ['completed', 'success', 'succeeded', 'paid'];
const KO = ['failed', 'cancelled', 'canceled', 'expired'];

type Result = { kind: 'ok'; until: Date } | { kind: 'pending' } | { kind: 'ko'; msg: string } | { kind: 'none' };

async function verify(): Promise<Result> {
  const ref = cookies().get(PAY_COOKIE)?.value;
  if (!ref) return { kind: 'none' };
  const store = await getMyStore();
  if (!store) return { kind: 'none' };
  const p = await getPayment(ref);
  if (!p) return { kind: 'ko', msg: 'Impossible de vérifier le paiement pour le moment. Réessayez dans un instant.' };
  if (p.storeId !== store.id) return { kind: 'ko', msg: 'Ce paiement ne correspond pas à votre boutique.' };
  if (KO.includes(p.status)) return { kind: 'ko', msg: 'Le paiement n’a pas abouti. Vous pouvez réessayer.' };
  if (!OK.includes(p.status)) return { kind: 'pending' };
  if (p.amount < PRIX_ABONNEMENT) return { kind: 'ko', msg: 'Le montant payé est inférieur à l’abonnement.' };
  const { data, error } = await createClient().rpc('activate_subscription', {
    p_store_id: store.id, p_reference: p.reference, p_amount: p.amount, p_proof: proofFor(store.id, p.reference, p.amount),
  });
  if (error) { console.error('[kitala] activate_subscription', error.message); return { kind: 'ko', msg: 'Paiement reçu mais activation impossible. Contactez-nous sur WhatsApp avec la référence ' + p.reference + '.' }; }
  return { kind: 'ok', until: new Date(String(data)) };
}

export default async function PaiementPage({ searchParams }: { searchParams: { e?: string } }) {
  const e = searchParams.e;
  let content: { tone: 'ok' | 'wait' | 'ko'; title: string; text: string; retry?: boolean };
  if (e === 'config') content = { tone: 'ko', title: 'Paiement indisponible', text: 'Le paiement en ligne n’est pas encore activé.' };
  else if (e === 'erreur') content = { tone: 'ko', title: 'Paiement non lancé', text: 'Impossible de contacter le service de paiement. Réessayez dans un instant.', retry: true };
  else if (e === 'annule') content = { tone: 'ko', title: 'Paiement annulé', text: 'Aucun montant n’a été prélevé.', retry: true };
  else {
    const r = paymentsConfigured() ? await verify() : ({ kind: 'none' } as Result);
    if (r.kind === 'ok') content = { tone: 'ok', title: 'Paiement reçu, merci !', text: `Votre abonnement est actif jusqu’au ${dateFmt.format(r.until)}. Votre boutique continue de recevoir des commandes.` };
    else if (r.kind === 'pending') content = { tone: 'wait', title: 'Paiement en cours de confirmation', text: 'Nous attendons la confirmation de l’opérateur. Actualisez cette page dans quelques instants.' };
    else if (r.kind === 'ko') content = { tone: 'ko', title: 'Paiement non confirmé', text: r.msg, retry: true };
    else content = { tone: 'wait', title: 'Aucun paiement en cours', text: 'Lancez le paiement de votre abonnement depuis le tableau de bord.', retry: true };
  }
  const color = content.tone === 'ok' ? 'border-feuille bg-feuille/10' : content.tone === 'ko' ? 'border-rose bg-rose/10' : 'border-soleil bg-soleil/25';
  const btn = 'inline-grid min-h-11 place-items-center rounded-xl bg-nuit px-5 font-display text-base font-extrabold text-white';
  return (
    <main className="mx-auto grid max-w-lg gap-5 py-10">
      <div role="status" className={`rounded-2xl border-2 p-6 ${color}`}>
        <h1 className="font-display text-2xl font-extrabold">{content.title}</h1>
        <p className="mt-2 text-sm font-medium">{content.text}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard" className={btn}>Retour au tableau de bord</Link>
        {content.retry && <form action={startPaymentAction}><button className={`${btn} bg-rose`}>Payer {PRIX_ABONNEMENT.toLocaleString('fr-FR')} FCFA</button></form>}
      </div>
    </main>
  );
}
