-- ============================================================================
-- Essai gratuit de 7 jours + abonnement (10 000 FCFA / mois, encaissé à la main).
-- Anti-abus : un seul essai par numéro WhatsApp / par e-mail (normalisé) ; les adresses jetables n'ont pas d'essai.
-- ============================================================================
alter table public.stores add column if not exists trial_ends_at timestamptz;
alter table public.stores add column if not exists paid_until timestamptz;
-- Les boutiques déjà créées reçoivent 7 jours à partir de maintenant.
update public.stores set trial_ends_at = now() + interval '7 days' where trial_ends_at is null;

-- Registre des essais déjà consommés (survit à la suppression d'une boutique ou d'un compte).
create table if not exists public.trial_claims (
  key text primary key,
  created_at timestamptz not null default now()
);
alter table public.trial_claims enable row level security; -- aucune policy, aucun grant : table interne

create or replace function public.norm_email(p text) returns text
language sql immutable set search_path = '' as $$
  select case
    when p is null or position('@' in p) = 0 then lower(coalesce(p, ''))
    else
      case when split_part(lower(p), '@', 2) in ('gmail.com', 'googlemail.com')
        then replace(split_part(split_part(lower(p), '@', 1), '+', 1), '.', '') || '@gmail.com'
        else split_part(split_part(lower(p), '@', 1), '+', 1) || '@' || split_part(lower(p), '@', 2)
      end
  end;
$$;

create or replace function public.stores_set_trial() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_auth_email text;
  v_keys text[];
  v_k text;
  v_used boolean := false;
  v_disposable text[] := array['mailinator.com','yopmail.com','yopmail.fr','guerrillamail.com','guerrillamail.net','sharklasers.com',
    '10minutemail.com','10minutemail.net','tempmail.com','temp-mail.org','trashmail.com','getnada.com','dispostable.com','maildrop.cc',
    'throwawaymail.com','fakeinbox.com','mohmal.com','mailnesia.com','tempail.com','emailondeck.com','mintemail.com','spamgourmet.com'];
begin
  select email into v_auth_email from auth.users where id = new.user_id;
  v_keys := array[
    'wa:' || right(new.whatsapp, 9),
    'em:' || public.norm_email(new.email),
    'em:' || public.norm_email(v_auth_email)
  ];
  foreach v_k in array v_keys loop
    if exists (select 1 from public.trial_claims where key = v_k) then v_used := true; end if;
  end loop;
  if split_part(lower(coalesce(v_auth_email, '')), '@', 2) = any (v_disposable)
     or split_part(lower(new.email), '@', 2) = any (v_disposable) then
    v_used := true;
  end if;

  new.paid_until := null;
  if v_used then
    new.trial_ends_at := now();                       -- essai déjà utilisé : la boutique est créée mais suspendue
  else
    new.trial_ends_at := now() + interval '7 days';
    foreach v_k in array v_keys loop
      insert into public.trial_claims (key) values (v_k) on conflict do nothing;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists stores_trial on public.stores;
create trigger stores_trial before insert on public.stores for each row execute function public.stores_set_trial();

-- Une boutique est ouverte pendant l'essai ou tant que l'abonnement est payé.
create or replace function public.store_is_open(p_store_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select coalesce(paid_until, trial_ends_at) > now() or trial_ends_at > now()
                   from public.stores where id = p_store_id), false);
$$;
revoke all on function public.store_is_open(uuid) from public;
grant execute on function public.store_is_open(uuid) to anon, authenticated;

-- Pas de commande possible sur une boutique suspendue (même en appelant l'API directement).
create or replace function public.orders_require_open_store() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.store_is_open(new.store_id) then raise exception 'BOUTIQUE_SUSPENDUE'; end if;
  return new;
end $$;
drop trigger if exists orders_open_store on public.orders;
create trigger orders_open_store before insert on public.orders for each row execute function public.orders_require_open_store();

-- Les boutiques existantes consomment leur essai (anti « supprimer puis recréer »).
insert into public.trial_claims (key)
  select 'wa:' || right(whatsapp, 9) from public.stores
  union select 'em:' || public.norm_email(email) from public.stores
  on conflict do nothing;
