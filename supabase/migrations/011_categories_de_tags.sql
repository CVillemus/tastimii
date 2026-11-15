-- Tastimii : les tags sont rangés en trois catégories.
--   - type_de_plat : Quiche & tarte, Soupe, Salade, Pâtes… (plusieurs par recette)
--   - saison       : Été, Hiver (au plus un par recette ; aucun = toute l'année)
--   - envie        : Réconfortant, Léger, Pour recevoir, Végétarien… (plusieurs par recette)
-- Les tags restent modifiables depuis l'app (nom, catégorie, suppression).
-- À coller dans Supabase → SQL Editor → Run.
--
-- Ce script ne casse pas la version en ligne : il ajoute une colonne et des tags. Aucune recette
-- n'est taguée automatiquement : Corentin et Marine rangent leurs recettes eux-mêmes.

-- 1. La catégorie : les tags existants (Rapide, Peu de vaisselle, Réconfortant…) sont des envies.
--    « if not exists » : le script peut être relancé sans erreur (tout le reste l'est déjà).
alter table public.tag
  add column if not exists category text not null default 'envie'
  check (category in ('type_de_plat', 'saison', 'envie'));

comment on column public.tag.category is
  'Catégorie du tag : type_de_plat, saison (au plus un par recette) ou envie.';

-- 2. « Préparation en avance » devient « À l'avance » (plus court, comme sur les livres).
update public.tag
set name = 'À l''avance'
where name = 'Préparation en avance';

-- 3. Les tags de départ. Un tag qui existe déjà sous ce nom est seulement rangé dans sa catégorie.
insert into public.tag (name, category) values
  ('Quiche & tarte', 'type_de_plat'),
  ('Soupe', 'type_de_plat'),
  ('Salade', 'type_de_plat'),
  ('Pâtes', 'type_de_plat'),
  ('Riz', 'type_de_plat'),
  ('Gratin', 'type_de_plat'),
  ('Mijoté', 'type_de_plat'),
  ('Poêlée', 'type_de_plat'),
  ('Dessert', 'type_de_plat'),
  ('Apéro', 'type_de_plat'),
  ('Été', 'saison'),
  ('Hiver', 'saison'),
  ('Réconfortant', 'envie'),
  ('Léger', 'envie'),
  ('Pour recevoir', 'envie'),
  ('Végétarien', 'envie'),
  ('Peu de vaisselle', 'envie'),
  ('À l''avance', 'envie')
on conflict (name) do update set category = excluded.category;
