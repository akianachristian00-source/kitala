import { createClient, getMyStore } from '@/lib/supabase/server';
import { ProductManager } from '@/components/dashboard/product-manager';
import type { Product } from '@/types';

export default async function ProductsPage() {
  const sb = createClient();
  const [{ data: { user } }, store] = await Promise.all([sb.auth.getUser(), getMyStore()]);
  const { data } = await sb.from('products').select('*').eq('store_id', store!.id).order('created_at', { ascending: false });
  return <ProductManager userId={user!.id} products={(data ?? []) as Product[]} />;
}
