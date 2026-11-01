'use client';
import { cn } from '@/lib/utils';
import { themeToCssVars, type ThemeConfig } from '@/lib/theme';
import type { Product, PublicStore } from '@/types';
import { CartProvider, useCart } from './cart-provider';
import { CartDrawer } from './cart-drawer';
import { ProductCard } from './product-card';

/**
 * Composant UNIQUE utilisé par la vitrine publique (SSR) ET par l'aperçu mobile du dashboard :
 * ce que le marchand voit est exactement ce que verra le client.
 */
export function StorefrontView({ store, products, theme, preview = false }: {
  store: Pick<PublicStore, 'id' | 'nom' | 'slug'>; products: Product[]; theme: ThemeConfig; preview?: boolean;
}) {
  return (
    <CartProvider storageKey={store.slug} persist={!preview}>
      <div style={themeToCssVars(theme)} className={cn('bg-k-bg text-k-text', preview ? 'relative h-full overflow-hidden' : 'min-h-screen')}>
        <div className={cn(preview && 'h-full overflow-y-auto')}>
          <Header nom={store.nom} />
          <section className="mx-auto max-w-6xl px-4 pb-6 pt-8 md:pt-14">
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">{theme.heroTitle || store.nom}</h1>
            <p className="mt-2 text-sm text-k-muted">{products.length} article{products.length > 1 ? 's' : ''} · commande confirmée sur WhatsApp</p>
          </section>
          <main className="mx-auto max-w-6xl px-4 pb-28">
            {products.length === 0 ? (
              <p className="rounded-k bg-k-surface p-8 text-center text-k-muted">Cette boutique n’a pas encore d’articles.</p>
            ) : (
              <div className="grid animate-reveal grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                {products.map((p, i) => <ProductCard key={p.id} product={p} cardStyle={theme.cardStyle} priority={i < 4} />)}
              </div>
            )}
          </main>
        </div>
        <CartDrawer storeId={store.id} slug={store.slug} preview={preview} />
      </div>
    </CartProvider>
  );
}

function Header({ nom }: { nom: string }) {
  const { count, setOpen } = useCart();
  return (
    <header className="sticky top-0 z-20 border-b border-k-line bg-k-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <span className="truncate font-semibold">{nom}</span>
        <button onClick={() => setOpen(true)} className="relative min-h-11 rounded-k px-3 text-sm font-medium text-k-primary" aria-label={`Ouvrir le panier, ${count} article(s)`}>
          Panier{count > 0 && <span className="ml-2 rounded-full bg-k-primary px-2 py-0.5 text-xs text-k-onprimary">{count}</span>}
        </button>
      </div>
    </header>
  );
}
