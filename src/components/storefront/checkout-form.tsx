'use client';
import { useState, useTransition } from 'react';
import { createOrderAction } from '@/actions/orders';
import { useCart } from './cart-provider';

export function CheckoutForm({ storeId, slug, onBack }: { storeId: string; slug: string; onBack: () => void }) {
  const { lines, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res = await createOrderAction({
        storeId, nom: String(fd.get('nom')), telephone: String(fd.get('telephone')), quartier: String(fd.get('quartier')),
        items: lines.map((l) => ({ productId: l.productId, quantite: l.quantite })),
      }, slug);
      if (!res.ok) return setError(res.error);
      clear();
      window.location.href = res.whatsappUrl; // ouvre WhatsApp (app mobile ou web) avec le message pré-rempli
    });
  }

  const field = 'min-h-12 w-full rounded-k border border-k-line bg-k-bg px-3 text-base text-k-text placeholder:text-k-muted';
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-4">
      <label className="grid gap-1 text-sm text-k-text">Nom complet
        <input name="nom" required minLength={2} autoComplete="name" className={field} placeholder="Ex. Grace Mbemba" /></label>
      <label className="grid gap-1 text-sm text-k-text">Téléphone (WhatsApp de préférence)
        <input name="telephone" required type="tel" inputMode="tel" autoComplete="tel" className={field} placeholder="+242 06 123 45 67" /></label>
      <label className="grid gap-1 text-sm text-k-text">Quartier de livraison
        <input name="quartier" required minLength={2} className={field} placeholder="Ex. Poto-Poto, près du marché" /></label>
      {error && <p role="alert" className="rounded-k bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="min-h-12 rounded-k bg-k-primary font-semibold text-k-onprimary disabled:opacity-60">
        {pending ? 'Enregistrement…' : 'Commander sur WhatsApp'}
      </button>
      <button type="button" onClick={onBack} className="min-h-11 text-sm text-k-muted underline">Retour au panier</button>
    </form>
  );
}
