import { subscriptionOf, payLink, PRIX_ABONNEMENT } from '@/lib/subscription';
import type { Store } from '@/types';
import { startPaymentAction } from '@/actions/billing';
import { paymentsConfigured } from '@/lib/geniuspay';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Africa/Brazzaville' });

// Tant que le paiement en ligne n'est pas entièrement configuré, on garde le paiement par WhatsApp.
function PayButton({ label, className, nom }: { label: string; className: string; nom: string }) {
  if (!paymentsConfigured()) return <a href={payLink(nom)} target="_blank" rel="noopener" className={className}>{label}</a>;
  return <form action={startPaymentAction}><button className={className}>{label}</button></form>;
}

/** Bandeau d'état de l'abonnement : essai en cours, boutique suspendue, ou rien si tout va bien. */
export function SubscriptionBanner({ store }: { store: Store }) {
  const sub = subscriptionOf(store);
  if (sub.etat === 'inconnu') return null;
  const btn = 'inline-grid min-h-11 place-items-center rounded-xl bg-nuit px-4 font-display text-base font-extrabold text-white';
  const prix = `${PRIX_ABONNEMENT.toLocaleString('fr-FR')} FCFA par mois`;

  if (sub.etat === 'actif') {
    return <p className="mb-6 rounded-xl border-2 border-feuille bg-feuille/10 px-4 py-3 text-sm font-semibold">Abonnement actif jusqu’au {dateFmt.format(sub.jusquau)}.</p>;
  }
  if (sub.etat === 'essai') {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-soleil bg-soleil/25 px-4 py-3">
        <p className="text-sm font-semibold">Essai gratuit : encore {sub.joursRestants} jour{sub.joursRestants > 1 ? 's' : ''} (jusqu’au {dateFmt.format(sub.jusquau)}). Ensuite {prix}.</p>
        <PayButton label="Payer l’abonnement" className={btn} nom={store.nom} />
      </div>
    );
  }
  return (
    <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-rose bg-rose/10 px-4 py-3">
      <p className="text-sm font-semibold text-rose">Votre essai est terminé : votre boutique est suspendue et ne reçoit plus de commandes. Abonnement : {prix}.</p>
      <PayButton label="Réactiver ma boutique" className={btn} nom={store.nom} />
    </div>
  );
}
