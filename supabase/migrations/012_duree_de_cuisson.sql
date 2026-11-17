-- Tastimii : deux durées facultatives, la préparation et la cuisson (« 15 min + 35 min »).
-- À coller dans Supabase → SQL Editor → Run. Une seule fois, sur la base partagée.
--
-- La colonne preparation_minutes existe déjà : elle devient la durée de préparation.
-- On ajoute cooking_minutes, vide par défaut : les recettes existantes gardent leur durée telle
-- quelle (affichée sans libellé tant qu'il n'y a pas de cuisson, comme avant).
-- Ce script ne casse pas la version en ligne : il ajoute une colonne facultative.

alter table public.recipe
  add column cooking_minutes integer check (cooking_minutes > 0);

comment on column public.recipe.preparation_minutes is
  'Durée de préparation en minutes (avant le script 012 : durée totale). Vide = non renseignée.';
comment on column public.recipe.cooking_minutes is
  'Durée de cuisson en minutes. Vide = non renseignée (ou pas de cuisson).';
