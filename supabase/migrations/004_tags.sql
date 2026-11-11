-- Tastimii : des tags sur les recettes (« Rapide », « Peu de vaisselle »…), pour filtrer la liste.
-- Une recette peut avoir zéro, un ou plusieurs tags.
-- À coller dans Supabase → SQL Editor → Run.
--
-- Ce script ne casse pas la version en ligne : il ajoute deux tables sans toucher aux recettes.

create table public.tag (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.recipe_tag (
  recipe_id uuid not null references public.recipe (id) on delete cascade,
  tag_id uuid not null references public.tag (id) on delete cascade,
  primary key (recipe_id, tag_id)
);

create index recipe_tag_tag_id_index on public.recipe_tag (tag_id);

-- Comme le reste de l'app : pas de comptes, tout le monde peut tout faire.
grant select, insert, update, delete on public.tag, public.recipe_tag to anon;

alter table public.tag enable row level security;
alter table public.recipe_tag enable row level security;

create policy "tout le monde peut tout faire" on public.tag
  for all to anon using (true) with check (true);
create policy "tout le monde peut tout faire" on public.recipe_tag
  for all to anon using (true) with check (true);

-- Quelques tags pour commencer.
insert into public.tag (name) values
  ('Rapide'),
  ('Peu de vaisselle'),
  ('Préparation en avance');
