import { createClient } from '@/lib/supabase/server';
import { formatFCFA } from '@/lib/utils';
import { OrderStatusActions } from '@/components/dashboard/order-status-actions';
import type { Order } from '@/types';

const BADGE: Record<string, string> = { nouvelle: 'bg-amber-100 text-amber-900', confirmee: 'bg-sky-100 text-sky-900', expediee: 'bg-indigo-100 text-indigo-900', livree: 'bg-emerald-100 text-emerald-900', annulee: 'bg-neutral-200 text-neutral-700' };

export default async function OrdersPage() {
  // RLS : seules les commandes de la boutique du marchand connecté sont retournées.
  const { data } = await createClient().from('orders').select('*, order_items(nom_produit, quantite)').order('created_at', { ascending: false }).limit(100);
  const orders = (data ?? []) as Order[];

  return (
    <section className="grid gap-3">
      <h1 className="text-xl font-semibold">Commandes</h1>
      {orders.length === 0 && <p className="rounded-xl bg-white p-8 text-center text-neutral-600">Aucune commande pour l’instant. Partagez le lien de votre boutique sur WhatsApp et vos réseaux.</p>}
      {orders.map((o) => (
        <article key={o.id} className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-medium">#{o.id.slice(0, 6).toUpperCase()} · {o.client_nom}</h2>
            <span className={`rounded-full px-2 py-0.5 text-xs ${BADGE[o.statut]}`}>{o.statut}</span>
          </div>
          <p className="text-sm text-neutral-600">{o.client_telephone} · {o.client_quartier}</p>
          <p className="mt-2 text-sm">{o.order_items.map((i) => `${i.quantite} × ${i.nom_produit}`).join(', ')}</p>
          <p className="mt-1 font-semibold">{formatFCFA(o.montant_total)}</p>
          <OrderStatusActions orderId={o.id} statut={o.statut} />
        </article>
      ))}
    </section>
  );
}
