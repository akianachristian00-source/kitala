'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { useCart } from './cart-provider';

/** Bouton « Ajouter au panier » avec retour visuel (✓ pendant 1,4 s). */
export function AddButton({ product: p, className, onAdded }: { product: Product; className?: string; onAdded?: () => void }) {
  const { add, lines } = useCart();
  const [done, setDone] = useState(false);
  const inCart = lines.find((l) => l.productId === p.id)?.quantite ?? 0;
  const soldOut = p.stock <= 0;
  const maxed = inCart >= p.stock;
  useEffect(() => { if (!done) return; const t = setTimeout(() => setDone(false), 1400); return () => clearTimeout(t); }, [done]);

  return (
    <button type="button" disabled={soldOut || maxed}
      onClick={() => { add({ productId: p.id, nom: p.nom, prix: p.prix, image_url: p.image_url, stock: p.stock }); setDone(true); onAdded?.(); }}
      className={cn('relative min-h-11 overflow-hidden rounded-k bg-k-primary px-4 text-sm font-semibold text-k-onprimary transition active:scale-[.97] disabled:opacity-45', className)}>
      {!soldOut && !maxed && !done && <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-white/35" />}
      <span className="relative">{soldOut ? 'Épuisé' : maxed ? 'Maximum dans le panier' : done ? 'Ajouté ✓' : inCart ? `Ajouter (${inCart} au panier)` : 'Ajouter au panier'}</span>
    </button>
  );
}
