'use client';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn, formatFCFA } from '@/lib/utils';
import { THEME_PRESETS, themeToCssVars, type ThemeConfig } from '@/lib/theme';
import type { Product, PublicStore } from '@/types';
import { CartProvider, useCart } from './cart-provider';
import { CartDrawer } from './cart-drawer';
import { ProductCard } from './product-card';
import { ProductDetail } from './product-detail';
import { AddButton } from './add-button';
import { Reveal } from './reveal';
import { CartIcon, SearchIcon, WhatsAppIcon } from './icons';

/**
 * Composant UNIQUE utilisé par la vitrine publique (SSR) ET par l'aperçu mobile du dashboard :
 * ce que le marchand voit est exactement ce que verra le client.
 */
export function StorefrontView({ store, products, theme, preview = false }: {
  store: Pick<PublicStore, 'id' | 'nom' | 'slug'>; products: Product[]; theme: ThemeConfig; preview?: boolean;
}) {
  return (
    <CartProvider storageKey={store.slug} persist={!preview}>
      <Inner store={store} products={products} theme={theme} preview={preview} />
    </CartProvider>
  );
}

function Inner({ store, products, theme, preview }: { store: Pick<PublicStore, 'id' | 'nom' | 'slug'>; products: Product[]; theme: ThemeConfig; preview: boolean }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLElement>(null);

  // Ombre sous l'en-tête dès qu'on fait défiler (page entière, ou conteneur en mode aperçu).
  useEffect(() => {
    const target: HTMLElement | Window = preview && scroller.current ? scroller.current : window;
    const get = () => (target instanceof Window ? target.scrollY : target.scrollTop);
    const onScroll = () => setScrolled(get() > 8);
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [preview]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => (q ? products.filter((p) => p.nom.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)) : products), [products, q]);
  const featured = !q ? (products.find((p) => p.image_url && p.stock > 0) ?? products[0]) : undefined;
  const rest = featured ? filtered.filter((p) => p.id !== featured.id) : filtered;
  const preset = THEME_PRESETS.find((p) => p.key === theme.preset);
  // Photo d'accueil : un autre produit que « Nouveauté » pour éviter le doublon ; sinon le même, sinon l'image du thème.
  const heroImage = products.find((p) => p.image_url && p.id !== featured?.id)?.image_url ?? featured?.image_url ?? preset?.img ?? null;
  const tagline = theme.tagline?.trim() || 'Commandez en quelques clics, confirmation sur WhatsApp.';

  const goProducts = () => productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div style={themeToCssVars(theme)} className={cn('bg-k-bg text-k-text', preview ? 'relative h-full overflow-hidden' : 'min-h-screen')}>
      <div ref={scroller} className={cn(preview && 'h-full overflow-y-auto')}>
        <Header nom={store.nom} scrolled={scrolled} searching={searching} setSearching={(v) => { setSearching(v); if (!v) setQuery(''); }} query={query} setQuery={setQuery} />

        {/* Accueil */}
        <section className="mx-auto max-w-6xl px-4 pt-4 md:pt-8">
          <div className="relative grid items-center gap-6 overflow-hidden rounded-[calc(var(--k-radius)+6px)] bg-k-tint px-6 py-8 md:grid-cols-[1.1fr_.9fr] md:px-12 md:py-12">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-k-primary/20 blur-3xl" />
            <div className="relative animate-reveal">
              <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">{theme.heroTitle || store.nom}</h1>
              <p className="mt-3 max-w-md text-lg font-medium md:text-xl">{tagline}</p>
              <p className="mt-2 max-w-md text-sm text-k-muted">{products.length} article{products.length > 1 ? 's' : ''} · commande confirmée sur WhatsApp</p>
              <button onClick={goProducts} className="group relative mt-6 inline-flex min-h-12 items-center gap-2 overflow-hidden rounded-k bg-k-primary px-6 font-semibold text-k-onprimary shadow-[0_10px_24px_-10px_var(--k-primary)] transition hover:-translate-y-0.5 active:scale-[.98]">
                <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-shine bg-white/40" />
                <WhatsAppIcon /> <span className="relative">Voir les produits</span>
              </button>
            </div>
            {heroImage && (
              <div className="relative mx-auto aspect-square w-full max-w-[340px] animate-floaty md:max-w-[420px]">
                <div aria-hidden className="absolute inset-4 rotate-6 rounded-[calc(var(--k-radius)+10px)] bg-k-primary/25" />
                <Image src={heroImage} alt="" fill priority sizes="(min-width:768px) 420px, 80vw" className="relative rounded-[calc(var(--k-radius)+10px)] object-cover shadow-[0_24px_50px_-20px_rgb(0_0_0/.45)]" />
              </div>
            )}
          </div>
        </section>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-8">
          {products.length === 0 ? (
            <p className="rounded-k bg-k-surface p-8 text-center text-k-muted">Cette boutique n’a pas encore d’articles.</p>
          ) : (
            <>
              {featured && (
                <Reveal className="mb-10">
                  <h2 className="mb-4 text-2xl font-bold md:text-3xl">Nouveauté</h2>
                  <article className="grid overflow-hidden rounded-[calc(var(--k-radius)+4px)] bg-white/70 shadow-[0_14px_36px_-16px_rgb(0_0_0/.3)] md:grid-cols-[.9fr_1.1fr]">
                    <button type="button" onClick={() => setSelected(featured)} aria-label={`Voir ${featured.nom}`} className="group relative block aspect-[4/3] overflow-hidden bg-k-tint md:aspect-auto md:min-h-[320px]">
                      {featured.image_url && <Image src={featured.image_url} alt={featured.nom} fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                    </button>
                    <div className="flex flex-col justify-center gap-3 p-5 md:p-9">
                      <h3 className="text-2xl font-bold leading-tight md:text-3xl">{featured.nom}</h3>
                      <p className="text-2xl font-bold">{formatFCFA(featured.prix)}</p>
                      {featured.description && <p className="line-clamp-4 text-sm leading-relaxed text-k-muted md:text-base">{featured.description}</p>}
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <AddButton product={featured} className="min-h-12 text-base" />
                        <button type="button" onClick={() => setSelected(featured)} className="min-h-12 rounded-k border border-k-line text-base font-semibold transition hover:bg-k-tint">Voir le détail</button>
                      </div>
                    </div>
                  </article>
                </Reveal>
              )}

              <section ref={productsRef} aria-labelledby="tous" className="scroll-mt-20">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h2 id="tous" className="text-2xl font-bold md:text-3xl">{q ? `Résultats (${filtered.length})` : featured ? 'Tous les produits' : 'Nos produits'}</h2>
                  {q && <button onClick={() => { setQuery(''); setSearching(false); }} className="min-h-11 text-sm font-semibold underline">Effacer la recherche</button>}
                </div>
                {rest.length === 0 && !featured ? (
                  <p className="rounded-k bg-k-surface p-8 text-center text-k-muted">Aucun produit ne correspond à « {query} ».</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                    {rest.map((p, i) => (
                      <Reveal key={p.id} delay={(i % 4) * 90} className="h-full"><ProductCard product={p} cardStyle={theme.cardStyle} priority={i < 4} onOpen={setSelected} /></Reveal>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>

        <footer className="border-t border-k-line bg-k-tint/60">
          <div className="mx-auto grid max-w-6xl gap-2 px-4 py-8 text-center text-sm text-k-muted md:grid-cols-[1fr_auto] md:text-left">
            <div>
              <p className="text-base font-bold uppercase tracking-[.25em] text-k-text">{store.nom}</p>
              <p className="mt-1">Commandes confirmées sur WhatsApp · paiement directement avec le vendeur.</p>
            </div>
            <p className="self-end">Boutique créée avec <a href="https://kitala-site.vercel.app" target="_blank" rel="noopener" className="font-semibold text-k-text underline">Kitala</a></p>
          </div>
        </footer>
      </div>

      {selected && <ProductDetail product={selected} onClose={() => setSelected(null)} preview={preview} />}
      <CartDrawer storeId={store.id} slug={store.slug} preview={preview} />
    </div>
  );
}

function Header({ nom, scrolled, searching, setSearching, query, setQuery }: { nom: string; scrolled: boolean; searching: boolean; setSearching: (v: boolean) => void; query: string; setQuery: (v: string) => void }) {
  const { count, setOpen } = useCart();
  const [bump, setBump] = useState(false);
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } setBump(true); const t = setTimeout(() => setBump(false), 450); return () => clearTimeout(t); }, [count]);
  const iconBtn = 'relative grid size-11 place-items-center rounded-full transition hover:bg-k-tint';
  return (
    <header className={cn('sticky top-0 z-20 bg-k-bg/90 backdrop-blur transition-shadow duration-300', scrolled ? 'shadow-[0_6px_24px_-12px_rgb(0_0_0/.35)]' : 'border-b border-k-line')}>
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[44px_1fr_44px] items-center px-3 md:px-4">
        <button onClick={() => setSearching(!searching)} aria-label="Rechercher un produit" aria-expanded={searching} className={iconBtn}><SearchIcon /></button>
        <span className="truncate text-center text-lg font-bold uppercase tracking-[.28em] md:text-xl">{nom}</span>
        <button onClick={() => setOpen(true)} className={iconBtn} aria-label={`Ouvrir le panier, ${count} article(s)`}>
          <CartIcon />
          {count > 0 && <span className={cn('absolute right-0 top-0 grid min-w-5 place-items-center rounded-full bg-k-primary px-1 text-[11px] font-bold leading-5 text-k-onprimary', bump && 'animate-pop')}>{count}</span>}
        </button>
      </div>
      {searching && (
        <div className="mx-auto max-w-6xl animate-fadeIn px-4 pb-3">
          <input autoFocus type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit…" aria-label="Rechercher un produit"
            className="min-h-12 w-full rounded-k border border-k-line bg-white/80 px-4 text-base outline-none focus:border-k-primary" />
        </div>
      )}
    </header>
  );
}
