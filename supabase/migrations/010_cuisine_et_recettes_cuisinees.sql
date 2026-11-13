-- Tastimii : la page Cuisine et le compteur de recettes cuisinées.
--
-- 1. « Courses faites » : les recettes au menu passent en cuisine (table kitchen_recipe) et la
--    liste de courses est vidée, en une seule opération (fonction finish_shopping).
-- 2. En cuisine, « Cuisinée » ajoute une ligne à l'historique (table recipe_cooking) et retire la
--    recette de la cuisine (fonction mark_kitchen_recipe_cooked). « Retirer » la retire sans la
--    compter.
-- 3. Le nombre de fois qu'une recette a été cuisinée = le nombre de ses lignes dans recipe_cooking.
--
-- À coller dans Supabase → SQL Editor → Run.
-- Ce script ne casse pas la version en ligne : il ajoute deux tables et deux fonctions,
-- sans rien modifier ni supprimer.

create table public.kitchen_recipe (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipe (id) on delete cascade,
  servings integer not null check (servings > 0),
  added_at timestamptz not null default now()
);

comment on table public.kitchen_recipe is
  'Recettes dont les courses sont faites, en attente d''être cuisinées.';

create table public.recipe_cooking (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipe (id) on delete cascade,
  servings integer not null check (servings > 0),
  cooked_at timestamptz not null default now()
);

comment on table public.recipe_cooking is
  'Historique : une ligne chaque fois qu''une recette est cuisinée.';

create index recipe_cooking_recipe_id_index on public.recipe_cooking (recipe_id);

-- Comme le reste de l'app : pas de comptes, tout le monde peut tout faire.
grant select, insert, update, delete on public.kitchen_recipe, public.recipe_cooking to anon;

alter table public.kitchen_recipe enable row level security;
alter table public.recipe_cooking enable row level security;

create policy "tout le monde peut tout faire" on public.kitchen_recipe
  for all to anon using (true) with check (true);
create policy "tout le monde peut tout faire" on public.recipe_cooking
  for all to anon using (true) with check (true);

-- « Courses faites » : déplace le menu en cuisine et vide la liste de courses.
-- Renvoie le nombre de recettes passées en cuisine.
create function public.finish_shopping()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  moved_recipe_count integer;
begin
  insert into kitchen_recipe (recipe_id, servings)
  select recipe_id, servings
  from shopping_list_recipe
  order by added_at;
  get diagnostics moved_recipe_count = row_count;

  -- « where true » : Supabase refuse les suppressions sans condition.
  delete from shopping_list_recipe where true;
  delete from shopping_list_checked_line where true;

  return moved_recipe_count;
end;
$$;

-- « Cuisinée » : compte la recette dans l'historique et la retire de la cuisine.
create function public.mark_kitchen_recipe_cooked(kitchen_recipe_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into recipe_cooking (recipe_id, servings)
  select recipe_id, servings
  from kitchen_recipe
  where id = kitchen_recipe_id;

  delete from kitchen_recipe where id = kitchen_recipe_id;
end;
$$;

grant execute on function public.finish_shopping() to anon;
grant execute on function public.mark_kitchen_recipe_cooked(uuid) to anon;
