'use client';
import Image from 'next/image';
import { cn, formatFCFA } from '@/lib/utils';
import type { Product } from '@/types';
import type { ThemeConfig } from '@/lib/theme';
import { useCart } from './cart-provider';

const CARD: Record<ThemeConfig['cardStyle'], string> = {
  flat: 'bg-k-surface',
  elevated: 'bg-k-bg shadow-[0_8px_24px_-8px_rgb(0_0_0/.25)] hover:-translate-y-0.5',
  outlined: 'bg-k-bg border border-k-line',
  soft: 'bg-k-tint',
};

export function ProductCard({ product: p, cardStyle, priority }: { product: Product; cardStyle: ThemeConfig['cardStyle']; priority?: boolean }) {
  const { add, lines } = useCart();
  const inCart = lines.find((l) => l.productId === p.id)?.quantite ?? 0;
  const soldOut = p.stock <= 0;
  const maxed = inCart >= p.stock;

  return (
    <article className={cn('flex flex-col overflow-hidden rounded-k transition duration-200', CARD[cardStyle])}>
      <div className="relative aspect-square bg-k-tint">
        {p.image_url && (
          <Image src={p.image_url} alt={p.nom} fill sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw"
            priority={priority} className={cn('object-cover', soldOut && 'opacity-50 grayscale')} />
        )}
        {soldOut && <span className="absolute left-2 top-2 rounded-full bg-k-text px-2 py-0.5 text-xs text-k-bg">Épuisé</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-k-text">{p.nom}</h3>
        {p.description && <p className="line-clamp-2 text-xs text-k-muted">{p.description}</p>}
        <p className="mt-auto pt-2 text-base font-semibold text-k-text">{formatFCFA(p.prix)}</p>
        <button type="button" disabled={soldOut || maxed}
          onClick={() => add({ productId: p.id, nom: p.nom, prix: p.prix, image_url: p.image_url, stock: p.stock })}
          className="mt-1 min-h-11 rounded-k bg-k-primary px-3 text-sm font-medium text-k-onprimary transition active:scale-[.97] disabled:opacity-40">
          {soldOut ? 'Épuisé' : maxed ? 'Quantité max. dans le panier' : inCart ? `Ajouter (${inCart} au panier)` : 'Ajouter au panier'}
        </button>
      </div>
    </article>
  );
}
