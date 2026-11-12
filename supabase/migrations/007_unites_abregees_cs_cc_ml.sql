-- Tastimii : unités abrégées.
-- « c. à soupe » → « cs », « c. à café » → « cc », « ml » → « mL » (et l'affichage passe en L, cL, mL).
-- À coller dans Supabase → SQL Editor → Run.
--
-- Ce script ne casse pas la version en ligne : elle affichera simplement « 2 cs » au lieu de
-- « 2 c. à soupe ». Les quantités ne changent pas.

-- 1. Unités des lignes de recettes.
update public.recipe_ingredient
set unit = 'cs'
where lower(trim(unit)) in ('c. à soupe', 'c. a soupe', 'c à soupe', 'cuillère à soupe', 'cas');

update public.recipe_ingredient
set unit = 'cc'
where lower(trim(unit)) in ('c. à café', 'c. a café', 'c à café', 'cuillère à café', 'cac');

update public.recipe_ingredient
set unit = 'mL'
where lower(trim(unit)) = 'ml' and unit <> 'mL';

-- 2. Unités habituelles des ingrédients.
update public.ingredient
set default_unit = 'cs'
where lower(trim(default_unit)) in ('c. à soupe', 'c. a soupe', 'c à soupe', 'cuillère à soupe', 'cas');

update public.ingredient
set default_unit = 'cc'
where lower(trim(default_unit)) in ('c. à café', 'c. a café', 'c à café', 'cuillère à café', 'cac');

update public.ingredient
set default_unit = 'mL'
where lower(trim(default_unit)) = 'ml' and default_unit <> 'mL';

-- 3. Lignes déjà cochées dans la liste de courses : leur clé contient l'unité
--    (« <ingredient_id>|c. à soupe ») ; on la renomme pour garder la case cochée.
--    « ml » reste tel quel : les clés sont toujours en minuscules.
update public.shopping_list_checked_line
set line_key = split_part(line_key, '|', 1) || '|cs'
where split_part(line_key, '|', 2) = 'c. à soupe';

update public.shopping_list_checked_line
set line_key = split_part(line_key, '|', 1) || '|cc'
where split_part(line_key, '|', 2) = 'c. à café';
