-- ============================================================================
-- KITALA — Schéma initial (Supabase / PostgreSQL)
-- Montants en FCFA : entiers (pas de décimales).
-- ============================================================================
create extension if not exists "pgcrypto";

create type public.order_status as enum ('nouvelle', 'confirmee', 'expediee', 'livree', 'annulee');

-- ---------------------------------------------------------------- TABLES ---
create table public.stores (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade, -- 1 boutique / compte (MVP)
  nom          text not null check (char_length(nom) between 2 and 80),
  slug         text not null unique
               check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40),
  whatsapp     text not null check (whatsapp ~ '^[0-9]{8,15}$'),      -- format international, sans "+"
  email        text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  theme_config jsonb not null default '{}'::jsonb check (jsonb_typeof(theme_config) = 'object'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  nom         text not null check (char_length(nom) between 2 and 120),
  description text check (char_length(description) <= 2000),
  prix        integer not null check (prix >= 0),
  stock       integer not null default 0 check (stock >= 0),
  image_url   text,
  actif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index products_store_idx on public.products (store_id, created_at desc);

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores(id) on delete cascade,
  client_nom       text not null,
  client_telephone text not null,
  client_quartier  text not null,
  montant_total    integer not null default 0 check (montant_total >= 0),
  statut           public.order_status not null default 'nouvelle',
  created_at       timestamptz not null default now()
);
create index orders_store_idx on public.orders (store_id, created_at desc);

create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null, -- l'historique survit à la suppression
  nom_produit   text not null,                                          -- snapshot du nom
  quantite      integer not null check (quantite > 0),
  prix_unitaire integer not null check (prix_unitaire >= 0)             -- snapshot du prix
);
create index order_items_order_idx on public.order_items (order_id);

-- --------------------------------------------------------------- TRIGGERS ---
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger stores_updated   before update on public.stores   for each row execute function public.set_updated_at();
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();

-- ------------------------------------------------------ FONCTIONS HELPERS ---
-- SECURITY DEFINER : évite d'exposer user_id / email via les GRANT de colonnes.
create or replace function public.owns_store(p_store_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.stores where id = p_store_id and user_id = auth.uid());
$$;

create or replace function public.get_my_store() returns setof public.stores
language sql stable security definer set search_path = public as $$
  select * from public.stores where user_id = auth.uid() limit 1;
$$;

revoke all on function public.owns_store(uuid), public.get_my_store() from public, anon;
grant execute on function public.owns_store(uuid), public.get_my_store() to authenticated;

-- ---------------------------------------------------- CRÉATION DE COMMANDE ---
-- Atomique : verrouille les produits, vérifie le stock, recalcule les prix CÔTÉ SERVEUR
-- (le client ne peut jamais imposer un prix), décrémente le stock.
create or replace function public.create_order(
  p_store_id uuid, p_nom text, p_telephone text, p_quartier text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_store    public.stores%rowtype;
  v_prod     public.products%rowtype;
  v_item     jsonb;
  v_qty      integer;
  v_order_id uuid;
  v_total    integer := 0;
  v_lines    jsonb := '[]'::jsonb;
begin
  select * into v_store from public.stores where id = p_store_id;
  if not found then raise exception 'STORE_INTROUVABLE'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'PANIER_VIDE';
  end if;

  insert into public.orders (store_id, client_nom, client_telephone, client_quartier)
  values (p_store_id, left(trim(p_nom), 80), left(trim(p_telephone), 20), left(trim(p_quartier), 120))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantite')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 99 then raise exception 'QUANTITE_INVALIDE'; end if;

    select * into v_prod from public.products
     where id = (v_item ->> 'product_id')::uuid and store_id = p_store_id and actif
       for update;
    if not found then raise exception 'PRODUIT_INDISPONIBLE'; end if;
    if v_prod.stock < v_qty then raise exception 'STOCK_INSUFFISANT:%', v_prod.nom; end if;

    update public.products set stock = stock - v_qty where id = v_prod.id;
    insert into public.order_items (order_id, product_id, nom_produit, quantite, prix_unitaire)
    values (v_order_id, v_prod.id, v_prod.nom, v_qty, v_prod.prix);

    v_total := v_total + v_qty * v_prod.prix;
    v_lines := v_lines || jsonb_build_object('nom', v_prod.nom, 'quantite', v_qty, 'prix_unitaire', v_prod.prix);
  end loop;

  update public.orders set montant_total = v_total where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'total',    v_total,
    'lines',    v_lines,
    'store',    jsonb_build_object('nom', v_store.nom, 'whatsapp', v_store.whatsapp, 'email', v_store.email)
  );
end $$;

revoke all on function public.create_order(uuid, text, text, text, jsonb) from public;
grant execute on function public.create_order(uuid, text, text, text, jsonb) to anon, authenticated;

-- ------------------------------------------------------------ PRIVILÈGES ---
-- Principe : tout fermer, puis ouvrir au strict nécessaire (colonne par colonne).
revoke all on public.stores, public.products, public.orders, public.order_items from anon, authenticated;

-- stores : le public ne voit ni e-mail ni WhatsApp ni user_id.
grant select (id, nom, slug, theme_config, created_at) on public.stores to anon, authenticated;
grant insert (user_id, nom, slug, whatsapp, email, theme_config) on public.stores to authenticated;
grant update (nom, slug, whatsapp, email, theme_config) on public.stores to authenticated;
grant delete on public.stores to authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

grant select on public.orders, public.order_items to authenticated;
grant update (statut) on public.orders to authenticated;  -- aucune insertion directe : uniquement create_order()

-- ------------------------------------------------------------------- RLS ---
alter table public.stores      enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- stores
create policy stores_public_read on public.stores for select to anon, authenticated using (true);
create policy stores_owner_insert on public.stores for insert to authenticated with check (user_id = auth.uid());
create policy stores_owner_update on public.stores for update to authenticated
  using (public.owns_store(id)) with check (public.owns_store(id));
create policy stores_owner_delete on public.stores for delete to authenticated using (public.owns_store(id));

-- products
create policy products_public_read on public.products for select to anon, authenticated using (actif);
create policy products_owner_all on public.products for all to authenticated
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));

-- orders / order_items : lecture réservée au commerçant concerné
create policy orders_owner_read on public.orders for select to authenticated using (public.owns_store(store_id));
create policy orders_owner_update on public.orders for update to authenticated
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy order_items_owner_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and public.owns_store(o.store_id)));

-- --------------------------------------------------------------- STORAGE ---
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy products_img_public_read on storage.objects for select using (bucket_id = 'products');
create policy products_img_owner_write on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and (storage.foldername(name))[1] = auth.uid()::text);
create policy products_img_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'products' and (storage.foldername(name))[1] = auth.uid()::text);
create policy products_img_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'products' and (storage.foldername(name))[1] = auth.uid()::text);
