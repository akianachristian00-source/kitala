import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Store } from '@/types';

export function createClient() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Server Component : géré par le middleware */ } },
    },
  });
}

/** Boutique du commerçant connecté (RPC SECURITY DEFINER : accès à email/whatsapp). */
export async function getMyStore(): Promise<Store | null> {
  const sb = createClient();
  const { data } = await sb.rpc('get_my_store').maybeSingle();
  return (data as Store | null) ?? null;
}
