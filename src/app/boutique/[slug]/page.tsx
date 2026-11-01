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

  const { data } = await createPublicClient().from('products').select('*').eq('store_id', store.id).eq('actif', true).order('created_at', { ascending: false });
  return <StorefrontView store={store} products={(data ?? []) as Product[]} theme={parseTheme(store.theme_config)} />;
}
