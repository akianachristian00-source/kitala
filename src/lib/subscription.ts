import type { Store } from '@/types';

export const PRIX_ABONNEMENT = 10000; // FCFA / mois
export const PAY_COOKIE = 'kitala_pay_ref'; // référence du paiement en cours (cookie)
export const KITALA_WHATSAPP = '242064035691'; // contact paiement (même numéro que le site vitrine)

export type Subscription =
  | { etat: 'actif'; jusquau: Date }
  | { etat: 'essai'; jusquau: Date; joursRestants: number }
  | { etat: 'suspendu' }
  | { etat: 'inconnu' }; // base pas encore migrée : on n'affiche rien et on ne bloque rien

/** État d'abonnement d'une boutique, calculé à partir des dates enregistrées dans Supabase. */
export function subscriptionOf(store: Pick<Store, 'trial_ends_at' | 'paid_until'>, now = new Date()): Subscription {
  if (store.trial_ends_at === undefined) return { etat: 'inconnu' };
  const paid = store.paid_until ? new Date(store.paid_until) : null;
  const trial = store.trial_ends_at ? new Date(store.trial_ends_at) : null;
  if (paid && paid > now) return { etat: 'actif', jusquau: paid };
  if (trial && trial > now) return { etat: 'essai', jusquau: trial, joursRestants: Math.max(1, Math.ceil((trial.getTime() - now.getTime()) / 86_400_000)) };
  return { etat: 'suspendu' };
}

export const payLink = (nom: string) =>
  `https://wa.me/${KITALA_WHATSAPP}?text=${encodeURIComponent(`Bonjour Kitala, je veux payer l'abonnement de ma boutique « ${nom} » (${PRIX_ABONNEMENT.toLocaleString('fr-FR')} FCFA / mois).`)}`;
