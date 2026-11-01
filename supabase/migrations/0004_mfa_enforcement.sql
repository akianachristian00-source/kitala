-- ============================================================================
-- Double authentification (TOTP) optionnelle, appliquée CÔTÉ BASE.
-- Règle : si un marchand a activé un facteur TOTP vérifié, ses données d'administration
-- ne sont accessibles qu'avec une session "aal2" (code de l'application d'authentification saisi).
-- Sans facteur activé, rien ne change. Les vitrines publiques ne sont jamais concernées.
-- ============================================================================

create or replace function public.mfa_ok() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified');
$$;
revoke all on function public.mfa_ok() from public, anon;
grant execute on function public.mfa_ok() to authenticated;

-- Écritures sur la boutique et les produits
create policy mfa_stores_ins   on public.stores   as restrictive for insert to authenticated with check (public.mfa_ok());
create policy mfa_stores_upd   on public.stores   as restrictive for update to authenticated using (public.mfa_ok()) with check (public.mfa_ok());
create policy mfa_stores_del   on public.stores   as restrictive for delete to authenticated using (public.mfa_ok());
create policy mfa_products_ins on public.products as restrictive for insert to authenticated with check (public.mfa_ok());
create policy mfa_products_upd on public.products as restrictive for update to authenticated using (public.mfa_ok()) with check (public.mfa_ok());
create policy mfa_products_del on public.products as restrictive for delete to authenticated using (public.mfa_ok());

-- Lecture des commandes (données clients)
create policy mfa_orders_sel      on public.orders      as restrictive for select to authenticated using (public.mfa_ok());
create policy mfa_order_items_sel on public.order_items as restrictive for select to authenticated using (public.mfa_ok());

-- Photos des produits
create policy mfa_storage_ins on storage.objects as restrictive for insert to authenticated with check (bucket_id <> 'products' or public.mfa_ok());
create policy mfa_storage_upd on storage.objects as restrictive for update to authenticated using (bucket_id <> 'products' or public.mfa_ok());
create policy mfa_storage_del on storage.objects as restrictive for delete to authenticated using (bucket_id <> 'products' or public.mfa_ok());

-- Fonctions SECURITY DEFINER : elles contournent la RLS, donc elles vérifient le MFA elles-mêmes.
create or replace function public.get_my_store() returns setof public.stores
language sql stable security definer set search_path = public as $$
  select * from public.stores where user_id = auth.uid() and public.mfa_ok() limit 1;
$$;

create or replace function public.set_order_status(p_order_id uuid, p_statut public.order_status)
returns public.order_status
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.mfa_ok() then raise exception 'MFA_REQUIS'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or not public.owns_store(v_order.store_id) then
    raise exception 'COMMANDE_INTROUVABLE';
  end if;

  if v_order.statut = p_statut then
    return v_order.statut;
  end if;

  if not (
       (v_order.statut = 'nouvelle'  and p_statut in ('confirmee', 'annulee'))
    or (v_order.statut = 'confirmee' and p_statut in ('expediee', 'annulee'))
    or (v_order.statut = 'expediee'  and p_statut in ('livree', 'annulee'))
  ) then
    raise exception 'TRANSITION_INVALIDE:% -> %', v_order.statut, p_statut;
  end if;

  if p_statut = 'annulee' then
    update public.products p
       set stock = p.stock + i.quantite
      from public.order_items i
     where i.order_id = v_order.id and i.product_id = p.id;
  end if;

  update public.orders set statut = p_statut where id = v_order.id;
  return p_statut;
end $$;
