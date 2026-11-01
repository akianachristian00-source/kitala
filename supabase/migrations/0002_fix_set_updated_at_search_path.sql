-- Fixe le search_path de la fonction trigger (alerte de sécurité Supabase)
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end $$;
