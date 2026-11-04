'use server';
import { revalidatePath } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import { orderInputSchema, type OrderInput } from '@/lib/validators';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { sendNewOrderEmail } from '@/lib/email';

export type CreateOrderResult = { ok: true; whatsappUrl: string; orderId: string } | { ok: false; error: string };

const ERRORS: Record<string, (d?: string) => string> = {
  STOCK_INSUFFISANT: (d) => `Stock insuffisant pour « ${d} ». Réduisez la quantité.`,
  PRODUIT_INDISPONIBLE: () => 'Un article de votre panier n’est plus disponible.',
  PANIER_VIDE: () => 'Votre panier est vide.',
};

export async function createOrderAction(input: OrderInput, slug: string): Promise<CreateOrderResult> {
  const parsed = orderInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' };
  const o = parsed.data;

  // Les prix et le stock sont revérifiés dans la base : le client n'envoie que des ids et des quantités.
  const { data, error } = await createPublicClient().rpc('create_order', {
    p_store_id: o.storeId, p_nom: o.nom, p_telephone: o.telephone, p_quartier: o.quartier,
    p_items: o.items.map((i) => ({ product_id: i.productId, quantite: i.quantite })),
  });
  if (error) {
    const [code, detail] = error.message.split(':');
    return { ok: false, error: ERRORS[code?.trim()]?.(detail?.trim()) ?? 'Impossible d’enregistrer la commande. Réessayez.' };
  }

  const r = data as { order_id: string; total: number; lines: { nom: string; quantite: number; prix_unitaire: number }[]; store: { nom: string; whatsapp: string; email: string } };
  const client = { nom: o.nom, telephone: o.telephone, quartier: o.quartier };

  // La commande est déjà sauvegardée : un échec d'e-mail ne doit jamais bloquer le client.
  try {
    await sendNewOrderEmail({ to: r.store.email, boutique: r.store.nom, orderId: r.order_id, total: r.total, lines: r.lines, client });
  } catch (e) { console.error('[kitala] e-mail commande non envoyé', e); }

  revalidatePath(`/boutique/${slug}`); // le stock a changé
  return {
    ok: true, orderId: r.order_id,
    whatsappUrl: buildWhatsAppUrl({ whatsapp: r.store.whatsapp, orderId: r.order_id, boutique: r.store.nom, lines: r.lines, total: r.total, client, position: o.position }),
  };
}
