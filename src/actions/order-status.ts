'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const schema = z.object({
  orderId: z.string().uuid(),
  statut: z.enum(['confirmee', 'expediee', 'livree', 'annulee']),
});

export type OrderStatusResult = { ok: true } | { ok: false; error: string };

/**
 * Change le statut d'une commande via la fonction SQL set_order_status() :
 * propriétaire vérifié en base (RLS/owns_store), transition validée, stock remis si annulation.
 */
export async function updateOrderStatusAction(orderId: string, statut: string): Promise<OrderStatusResult> {
  const parsed = schema.safeParse({ orderId, statut });
  if (!parsed.success) return { ok: false, error: 'Statut invalide.' };

  const { error } = await createClient().rpc('set_order_status', { p_order_id: parsed.data.orderId, p_statut: parsed.data.statut });
  if (error) {
    if (error.message.includes('TRANSITION_INVALIDE')) return { ok: false, error: 'Ce changement de statut n’est pas possible.' };
    if (error.message.includes('COMMANDE_INTROUVABLE')) return { ok: false, error: 'Commande introuvable.' };
    return { ok: false, error: 'Impossible de modifier la commande. Réessayez.' };
  }
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/commandes');
  return { ok: true };
}
