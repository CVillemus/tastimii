-- Tastimii :
-- 1. une case « Souvent à la maison » sur les ingrédients (sel, beurre, bouillon…) : dans la liste
--    de courses, ils passent dans une section « À vérifier avant de partir » ;
-- 2. les quantités sont stockées dans la plus petite unité (g, ml) : l'app affiche ensuite
--    l'unité la plus lisible (1000 ml → 1 l, 250 ml → 25 cl, 1500 g → 1,5 kg).
-- À coller dans Supabase → SQL Editor → Run.
--
-- Ce script ne casse pas la version en ligne : il ajoute une colonne et convertit des quantités
-- (l'ancienne version affichera simplement « 1000 ml » au lieu de « 1 l »).

-- 1. Souvent à la maison.
alter table public.ingredient
  add column is_usually_at_home boolean not null default false;

comment on column public.ingredient.is_usually_at_home is
  'Souvent à la maison : à vérifier avant les courses plutôt qu''à acheter d''office.';

-- 2. Quantités des recettes en g et ml.
update public.recipe_ingredient
set quantity = quantity * 1000, unit = 'g'
where lower(trim(unit)) = 'kg';

update public.recipe_ingredient
set quantity = quantity * 1000, unit = 'ml'
where lower(trim(unit)) = 'l';

update public.recipe_ingredient
set quantity = quantity * 10, unit = 'ml'
where lower(trim(unit)) = 'cl';

update public.recipe_ingredient
set unit = lower(trim(unit))
where lower(trim(unit)) in ('g', 'ml') and unit <> lower(trim(unit));

-- 3. Unités habituelles des ingrédients en g et ml.
update public.ingredient
set default_unit = 'g'
where lower(trim(default_unit)) in ('g', 'kg');

update public.ingredient
set default_unit = 'ml'
where lower(trim(default_unit)) in ('ml', 'cl', 'l');
