-- ============================================================================
-- Liste des quartiers (lecture publique) : le client choisit son quartier dans une liste au lieu de le taper.
-- Modifiable à la main dans Supabase (Table Editor > quartiers) sans toucher au code.
-- ============================================================================
create table if not exists public.quartiers (
  id    bigint generated always as identity primary key,
  ville text not null,
  nom   text not null,
  unique (ville, nom)
);
alter table public.quartiers enable row level security;
drop policy if exists quartiers_read on public.quartiers;
create policy quartiers_read on public.quartiers for select to anon, authenticated using (true);
revoke all on public.quartiers from anon, authenticated;
grant select on public.quartiers to anon, authenticated;

insert into public.quartiers (ville, nom) values
  ('Brazzaville','Centre-ville'),('Brazzaville','Plateau'),('Brazzaville','Plateau des 15 ans'),('Brazzaville','Poto-Poto'),
  ('Brazzaville','Moungali'),('Brazzaville','Ouenzé'),('Brazzaville','Talangaï'),('Brazzaville','Bacongo'),
  ('Brazzaville','Makélékélé'),('Brazzaville','Mfilou'),('Brazzaville','Madibou'),('Brazzaville','Djiri'),
  ('Brazzaville','Mpila'),('Brazzaville','Mikalou'),('Brazzaville','Massengo'),('Brazzaville','Ngamakosso'),
  ('Brazzaville','Kinsoundi'),('Brazzaville','Mpissa'),('Brazzaville','Diata'),('Brazzaville','Mafouta'),
  ('Brazzaville','Ngangouoni'),('Brazzaville','Moukondo'),('Brazzaville','Kintélé'),
  ('Pointe-Noire','Centre-ville'),('Pointe-Noire','Tié-Tié'),('Pointe-Noire','Loandjili'),('Pointe-Noire','Lumumba'),
  ('Pointe-Noire','Mvou-Mvou'),('Pointe-Noire','Mongo-Mpoukou'),('Pointe-Noire','Ngoyo'),('Pointe-Noire','Tchimbamba'),
  ('Pointe-Noire','Mpaka'),('Pointe-Noire','Siafoumou')
on conflict do nothing;
