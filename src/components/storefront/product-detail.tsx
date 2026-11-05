'use client';
import Image from 'next/image';
import { useEffect } from 'react';
import { cn, formatFCFA } from '@/lib/utils';
import type { Product } from '@/types';
import { AddButton } from './add-button';
import { CloseIcon, WhatsAppIcon } from './icons';
import { useCart } from './cart-provider';

/** Fiche produit : grande photo, description, stock, ajout au panier. */
export function ProductDetail({ product: p, onClose, preview }: { product: Product; onClose: () => void; preview: boolean }) {
  const { setOpen } = useCart();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const soldOut = p.stock <= 0;

  return (
    <div className={cn(preview ? 'absolute' : 'fixed', 'inset-0 z-50')} role="dialog" aria-modal="true" aria-label={p.nom}>
      <div className="absolute inset-0 animate-fadeIn bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[92%] animate-sheet flex-col overflow-hidden rounded-t-[calc(var(--k-radius)+8px)] bg-k-bg text-k-text md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[88vh] md:w-[min(900px,92vw)] md:-translate-x-1/2 md:-translate-y-1/2 md:flex-row md:rounded-[calc(var(--k-radius)+8px)]">
        <button onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-white/90 text-black shadow"><CloseIcon /></button>
        <div className="relative aspect-[4/3] shrink-0 bg-k-tint md:aspect-auto md:w-1/2">
          {p.image_url && <Image src={p.image_url} alt={p.nom} fill sizes="(min-width:768px) 450px, 100vw" className="object-cover" priority />}
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5 md:p-8">
          <h2 className="text-2xl font-bold leading-tight md:text-3xl">{p.nom}</h2>
          <p className="text-2xl font-bold text-k-text">{formatFCFA(p.prix)}</p>
          <p className="text-sm font-medium text-k-muted">
            {soldOut ? 'Épuisé pour le moment' : p.stock <= 5 ? `Plus que ${p.stock} en stock` : 'En stock'}
          </p>
          {p.description && <p className="whitespace-pre-line text-sm leading-relaxed md:text-base">{p.description}</p>}
          <div className="mt-auto grid gap-2 pt-2">
            <AddButton product={p} className="min-h-12 text-base" />
            <button type="button" onClick={() => { onClose(); setOpen(true); }} className="min-h-11 rounded-k border border-k-line text-sm font-semibold">Voir mon panier</button>
            <p className="flex items-center justify-center gap-2 pt-1 text-xs text-k-muted"><WhatsAppIcon className="size-4 text-[#25D366]" />Vous finalisez la commande sur WhatsApp, le paiement se règle avec le vendeur.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
