'use server';
import { revalidatePath } from 'next/cache';
import { createClient, getMyStore } from '@/lib/supabase/server';
import { productSchema, type ProductInput } from '@/lib/validators';

type Result = { ok: true } | { ok: false; error: string };

export async function saveProductAction(input: ProductInput): Promise<Result> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const store = await getMyStore();
  if (!store) return { ok: false, error: 'Boutique introuvable' };

  // Seules les images de NOTRE bucket sont acceptées.
  const img = parsed.data.image_url;
  if (img && !img.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/`)) return { ok: false, error: 'Image non autorisée' };

  const { id, ...fields } = parsed.data;
  const sb = createClient();
  const { error } = id
    ? await sb.from('products').update(fields).eq('id', id)                       // RLS : seulement ses produits
    : await sb.from('products').insert({ ...fields, store_id: store.id });
  if (error) return { ok: false, error: 'Enregistrement impossible' };
  revalidatePath(`/boutique/${store.slug}`); revalidatePath('/dashboard/produits');
  return { ok: true };
}

export async function deleteProductAction(id: string): Promise<Result> {
  const store = await getMyStore();
  if (!store) return { ok: false, error: 'Boutique introuvable' };
  const { error } = await createClient().from('products').delete().eq('id', id);
  if (error) return { ok: false, error: 'Suppression impossible' };
  revalidatePath(`/boutique/${store.slug}`); revalidatePath('/dashboard/produits');
  return { ok: true };
}
