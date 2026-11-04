import { createClient } from '@/lib/supabase/server';
import { formatFCFA } from '@/lib/utils';
import { OrderStatusActions } from '@/components/dashboard/order-status-actions';
import type { Order, OrderStatus } from '@/types';

const STATUS: Record<OrderStatus, { label: string; pill: string; dot: string }> = {
  nouvelle: { label: 'Nouvelle', pill: 'bg-soleil/40 text-nuit', dot: 'bg-soleil' },
  confirmee: { label: 'Confirmée', pill: 'bg-sky-100 text-sky-900', dot: 'bg-sky-500' },
  expediee: { label: 'Expédiée', pill: 'bg-indigo-100 text-indigo-900', dot: 'bg-indigo-500' },
  livree: { label: 'Livrée', pill: 'bg-feuille/15 text-emerald-900', dot: 'bg-feuille' },
  annulee: { label: 'Annulée', pill: 'bg-neutral-200 text-neutral-700', dot: 'bg-neutral-500' },
};

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' });

/** Liste des commandes du marchand connecté. RLS : seules les commandes de sa boutique sont retournées. */
export async function OrdersList({ limit }: { limit: number }) {
  const { data } = await createClient().from('orders').select('*, order_items(nom_produit, quantite)').order('created_at', { ascending: false }).limit(limit);
  const orders = (data ?? []) as Order[];

  if (orders.length === 0) {
    return <p className="rounded-2xl border-2 border-dashed border-nuit/20 bg-white p-8 text-center text-nuit/70">Aucune commande pour l’instant. Partagez le lien de votre boutique sur WhatsApp et vos réseaux.</p>;
  }
  return (
    <div className="grid gap-3">
      {orders.map((o) => {
        const s = STATUS[o.statut];
        return (
          <article key={o.id} className="rounded-2xl border-2 border-nuit/10 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-extrabold">#{o.id.slice(0, 6).toUpperCase()} · {o.client_nom}</h3>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${s.pill}`}><span aria-hidden className={`h-2 w-2 rounded-full ${s.dot}`} />{s.label}</span>
            </div>
            <p className="mt-1 text-sm text-nuit/70">{o.client_telephone} · {o.client_quartier} · {dateFmt.format(new Date(o.created_at))}</p>
            <p className="mt-2 text-sm">{o.order_items.map((i) => `${i.quantite} × ${i.nom_produit}`).join(', ')}</p>
            <p className="mt-1 font-display text-lg font-extrabold">{formatFCFA(o.montant_total)}</p>
            <OrderStatusActions orderId={o.id} statut={o.statut} />
          </article>
        );
      })}
    </div>
  );
}
