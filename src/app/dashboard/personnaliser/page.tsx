import { createClient, getMyStore } from '@/lib/supabase/server';
import { parseTheme } from '@/lib/theme';
import { ThemeCustomizer } from '@/components/dashboard/theme-customizer';
import type { Product } from '@/types';

export default async function CustomizePage() {
  const store = (await getMyStore())!;
  const { data } = await createClient().from('products').select('*').eq('store_id', store.id).eq('actif', true).order('created_at', { ascending: false }).limit(8);
  return <ThemeCustomizer store={{ id: store.id, nom: store.nom, slug: store.slug }} products={(data ?? []) as Product[]} initial={parseTheme(store.theme_config)} />;
}
