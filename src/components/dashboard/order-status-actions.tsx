'use client';
import { useState, useTransition } from 'react';
import { updateOrderStatusAction } from '@/actions/order-status';
import type { OrderStatus } from '@/types';

// Doit rester identique aux transitions de la fonction SQL set_order_status().
const NEXT: Record<OrderStatus, { statut: 'confirmee' | 'expediee' | 'livree' | 'annulee'; label: string; danger?: boolean }[]> = {
  nouvelle: [{ statut: 'confirmee', label: 'Confirmer' }, { statut: 'annulee', label: 'Annuler', danger: true }],
  confirmee: [{ statut: 'expediee', label: 'Marquer expédiée' }, { statut: 'annulee', label: 'Annuler', danger: true }],
  expediee: [{ statut: 'livree', label: 'Marquer livrée' }, { statut: 'annulee', label: 'Annuler', danger: true }],
  livree: [],
  annulee: [],
};

export function OrderStatusActions({ orderId, statut }: { orderId: string; statut: OrderStatus }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const actions = NEXT[statut];
  if (actions.length === 0) return null;

  function change(next: string, danger?: boolean) {
    if (danger && !window.confirm('Annuler cette commande ? Le stock des articles sera remis automatiquement.')) return;
    setError(null);
    start(async () => {
      const res = await updateOrderStatusAction(orderId, next);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.statut}
            type="button"
            disabled={pending}
            onClick={() => change(a.statut, a.danger)}
            className={`min-h-[44px] rounded-lg px-3 text-sm font-medium disabled:opacity-50 ${a.danger ? 'border border-red-300 text-red-700' : 'bg-neutral-900 text-white'}`}
          >
            {pending ? '…' : a.label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
