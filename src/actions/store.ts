'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getMyStore } from '@/lib/supabase/server';
import { storeSchema } from '@/lib/validators';
import { themeSchema, type ThemeConfig } from '@/lib/theme';

export async function createStoreAction(_: unknown, fd: FormData): Promise<{ error: string } | undefined> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const parsed = storeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await sb.from('stores').insert({ ...parsed.data, user_id: user.id });
  if (error) return { error: error.code === '23505' ? 'Ce nom de boutique (slug) est déjà pris.' : 'Création impossible.' };
  redirect('/dashboard');
}

export async function saveThemeAction(theme: ThemeConfig): Promise<{ ok: boolean; error?: string }> {
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) return { ok: false, error: 'Thème invalide' };
  const store = await getMyStore();
  if (!store) return { ok: false, error: 'Boutique introuvable' };

  const { error } = await createClient().from('stores').update({ theme_config: parsed.data }).eq('id', store.id); // RLS : propriétaire uniquement
  if (error) return { ok: false, error: 'Enregistrement impossible' };
  revalidatePath(`/boutique/${store.slug}`);
  return { ok: true };
}
