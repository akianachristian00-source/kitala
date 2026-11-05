'use client';
import Image from 'next/image';
import { cn, formatFCFA } from '@/lib/utils';
import type { Product } from '@/types';
import type { ThemeConfig } from '@/lib/theme';
import { AddButton } from './add-button';

const CARD: Record<ThemeConfig['cardStyle'], string> = {
  flat: 'bg-k-surface',
  elevated: 'bg-white/70 shadow-[0_10px_30px_-12px_rgb(0_0_0/.28)] hover:shadow-[0_18px_36px_-12px_rgb(0_0_0/.32)]',
  outlined: 'bg-k-bg border border-k-line',
  soft: 'bg-k-tint',
};

export function ProductCard({ product: p, cardStyle, priority, onOpen }: { product: Product; cardStyle: ThemeConfig['cardStyle']; priority?: boolean; onOpen: (p: Product) => void }) {
  const soldOut = p.stock <= 0;
  const low = !soldOut && p.stock <= 3;
  return (
    <article className={cn('group flex h-full flex-col overflow-hidden rounded-k transition duration-300 hover:-translate-y-1', CARD[cardStyle])}>
      <button type="button" onClick={() => onOpen(p)} aria-label={`Voir ${p.nom}`} className="relative block aspect-square overflow-hidden bg-k-tint text-left">
        {p.image_url && (
          <Image src={p.image_url} alt={p.nom} fill sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" priority={priority}
            className={cn('object-cover transition duration-500 group-hover:scale-110', soldOut && 'opacity-50 grayscale')} />
        )}
        {soldOut && <span className="absolute left-2 top-2 rounded-full bg-k-text px-2.5 py-0.5 text-xs font-medium text-k-bg">Épuisé</span>}
        {low && <span className="absolute left-2 top-2 rounded-full bg-k-primary px-2.5 py-0.5 text-xs font-semibold text-k-onprimary">Plus que {p.stock}</span>}
      </button>
      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug md:text-base">{p.nom}</h3>
        <p className="text-base font-bold">{formatFCFA(p.prix)}</p>
        <AddButton product={p} className="mt-auto w-full" />
      </div>
    </article>
  );
}
