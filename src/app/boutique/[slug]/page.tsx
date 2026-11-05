import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createPublicClient } from '@/lib/supabase/public';
import { parseTheme } from '@/lib/theme';
import { StorefrontView } from '@/components/storefront/storefront-view';
import type { Product, PublicStore } from '@/types';

// ISR : HTML statique servi depuis le CDN, régénéré toutes les 60 s (et à chaque commande/modif via revalidatePath).
export const revalidate = 60;

const getStore = cache(async (slug: string) => {
  const { data } = await createPublicClient().from('stores').select('id, nom, slug, theme_config').eq('slug', slug).maybeSingle();
  return data as PublicStore | null;
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const store = await getStore(params.slug);
  if (!store) return { title: 'Boutique introuvable' };
  return { title: store.nom, description: `Commandez chez ${store.nom} en quelques clics, confirmation sur WhatsApp.`, openGraph: { title: store.nom, type: 'website' } };
}

export default async function BoutiquePage({ params }: { params: { slug: string } }) {
  const store = await getStore(params.slug);
  if (!store) notFound();

  // Boutique suspendue (essai terminé, abonnement non payé) : on n'affiche pas les produits. En cas d'erreur technique on laisse ouvert.
  const { data: open, error: openErr } = await createPublicClient().rpc('store_is_open', { p_store_id: store.id });
  if (!openErr && open === false) {
    return (
      <main className="grid min-h-screen place-items-center bg-pale px-5 text-center text-nuit">
        <div className="grid max-w-sm gap-2">
          <h1 className="font-display text-3xl font-extrabold">{store.nom}</h1>
          <p className="text-nuit/70">Cette boutique est momentanément indisponible. Revenez bientôt.</p>
        </div>
      </main>
    );
  }
  const { data } = await createPublicClient().from('products').select('*').eq('store_id', store.id).eq('actif', true).order('created_at', { ascending: false });
  return <StorefrontView store={store} products={(data ?? []) as Product[]} theme={parseTheme(store.theme_config)} />;
}
