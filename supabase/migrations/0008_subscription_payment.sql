-- ============================================================================
-- Paiement de l'abonnement (GeniusPay). Le serveur Next.js vérifie le paiement auprès de GeniusPay, puis appelle
-- activate_subscription avec une preuve HMAC : un commerçant ne peut donc pas s'offrir des mois en appelant l'API.
-- La clé de la preuve (ligne 'payment_proof' de app_secrets) est créée à la main, jamais dans le dépôt.
-- ============================================================================
create table if not exists public.app_secrets (name text primary key, value text not null);
alter table public.app_secrets enable row level security; -- aucune policy, aucun grant
revoke all on public.app_secrets from anon, authenticated;

create table if not exists public.subscription_payments (
  reference text primary key,                      -- une référence GeniusPay ne compte qu'une seule fois
  store_id uuid not null references public.stores(id) on delete cascade,
  amount integer not null,
  created_at timestamptz not null default now()
);
alter table public.subscription_payments enable row level security;
revoke all on public.subscription_payments from anon, authenticated;
create index if not exists subscription_payments_store_idx on public.subscription_payments(store_id);

create or replace function public.activate_subscription(p_store_id uuid, p_reference text, p_amount integer, p_proof text)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_secret text;
  v_expected text;
  v_rows integer;
  v_until timestamptz;
begin
  if not public.owns_store(p_store_id) then raise exception 'FORBIDDEN'; end if;
  select value into v_secret from public.app_secrets where name = 'payment_proof';
  if v_secret is null then raise exception 'NOT_CONFIGURED'; end if;
  v_expected := encode(extensions.hmac(p_store_id::text || '|' || p_reference || '|' || p_amount::text, v_secret, 'sha256'), 'hex');
  if p_proof is null or p_proof <> v_expected then raise exception 'BAD_PROOF'; end if;

  insert into public.subscription_payments (reference, store_id, amount) values (p_reference, p_store_id, p_amount)
    on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows > 0 then
    update public.stores set paid_until = greatest(coalesce(paid_until, now()), now()) + interval '30 days' where id = p_store_id;
  end if;
  select paid_until into v_until from public.stores where id = p_store_id;
  return v_until;
end $$;
revoke all on function public.activate_subscription(uuid, text, integer, text) from public, anon;
grant execute on function public.activate_subscription(uuid, text, integer, text) to authenticated;
