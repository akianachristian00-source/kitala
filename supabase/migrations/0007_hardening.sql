-- Fonctions de déclencheur : jamais appelables directement (les déclencheurs continuent de fonctionner).
revoke all on function public.stores_set_trial() from public, anon, authenticated;
revoke all on function public.orders_require_open_store() from public, anon, authenticated;
revoke all on function public.norm_email(text) from public, anon;
grant execute on function public.norm_email(text) to authenticated;

-- Performance : index sur la clé étrangère des lignes de commande et évaluation unique de auth.uid().
create index if not exists order_items_product_id_idx on public.order_items (product_id);
alter policy stores_owner_insert on public.stores with check (user_id = (select auth.uid()));
