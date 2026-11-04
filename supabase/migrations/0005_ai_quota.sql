-- Quota quotidien de l'assistant IA, par marchand (protège le quota Gemini et la facture).
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'Africa/Brazzaville')::date,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security; -- aucune policy : accès uniquement via la fonction ci-dessous

create or replace function public.ai_take_quota(p_limit int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  d date := (now() at time zone 'Africa/Brazzaville')::date;
  c int;
begin
  if uid is null then return false; end if;
  insert into public.ai_usage (user_id, day, count) values (uid, d, 0) on conflict do nothing;
  update public.ai_usage set count = count + 1
    where user_id = uid and day = d and count < p_limit
    returning count into c;
  return c is not null;
end;
$$;
revoke all on function public.ai_take_quota(int) from public, anon;
grant execute on function public.ai_take_quota(int) to authenticated;
