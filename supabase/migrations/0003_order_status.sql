-- ============================================================================
-- Changement de statut des commandes (phase 4.1)
-- - Une seule porte d'entrée : set_order_status() (propriétaire vérifié, transaction, verrou).
-- - Annulation => le stock des articles est remis automatiquement.
-- - "livree" et "annulee" sont des états finaux (évite un double décrément/incrément du stock).
-- ============================================================================

create or replace function public.set_order_status(p_order_id uuid, p_statut public.order_status)
returns public.order_status
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or not public.owns_store(v_order.store_id) then
    raise exception 'COMMANDE_INTROUVABLE';
  end if;

  if v_order.statut = p_statut then
    return v_order.statut; -- rien à faire (double clic)
  end if;

  if not (
       (v_order.statut = 'nouvelle'  and p_statut in ('confirmee', 'annulee'))
    or (v_order.statut = 'confirmee' and p_statut in ('expediee', 'annulee'))
    or (v_order.statut = 'expediee'  and p_statut in ('livree', 'annulee'))
  ) then
    raise exception 'TRANSITION_INVALIDE:% -> %', v_order.statut, p_statut;
  end if;

  if p_statut = 'annulee' then
    -- Remise en stock (les produits supprimés entre-temps ont product_id = null : ignorés).
    update public.products p
       set stock = p.stock + i.quantite
      from public.order_items i
     where i.order_id = v_order.id and i.product_id = p.id;
  end if;

  update public.orders set statut = p_statut where id = v_order.id;
  return p_statut;
end $$;

revoke all on function public.set_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;

-- Plus de modification directe du statut : sinon on pourrait annuler sans remettre le stock.
revoke update on public.orders from authenticated;
drop policy if exists orders_owner_update on public.orders;
