-- Tastimii : un emoji par type d'ingrédient (🥩 Viandes, 🧀 Œufs et produits laitiers…), dans sa
-- propre colonne, affiché devant le nom (page Ingrédients, rayons de la liste de courses).
-- À coller dans Supabase → SQL Editor → Run.
--
-- Les emojis déjà tapés au début des noms (« 🥩 Viandes ») sont déplacés dans la nouvelle colonne,
-- et le nom redevient « Viandes » : le tri alphabétique se fait de nouveau sur le nom.
-- La version en ligne continue de marcher (elle affichera les noms sans emoji).

-- 1. La colonne, vide par défaut.
alter table public.ingredient_family
  add column emoji text not null default '';

comment on column public.ingredient_family.emoji is
  'Emoji affiché devant le nom du type (🥩, 🧀…). Vide = pas d''emoji.';

-- 2. Les emojis en tête de nom : tout ce qui précède le premier mot (ni lettre, ni chiffre,
--    ni espace), suivi d'un espace.
update public.ingredient_family
set
  emoji = substring(name from '^([^[:alnum:][:space:]]+)[[:space:]]+'),
  name = trim(regexp_replace(name, '^[^[:alnum:][:space:]]+[[:space:]]+', ''))
where name ~ '^[^[:alnum:][:space:]]+[[:space:]]+[[:alnum:]]';
