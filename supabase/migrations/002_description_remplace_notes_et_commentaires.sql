-- Tastimii : les notes et les commentaires deviennent une seule description libre,
-- en texte riche (HTML produit par l'éditeur), affichée en tête de la recette.
-- À coller dans Supabase → SQL Editor → Run.

-- Les notes existantes sont gardées : chaque ligne devient un paragraphe.
alter table public.recipe rename column notes to description;

update public.recipe
set description = '<p>' || replace(
  replace(replace(replace(description, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'),
  E'\n',
  '</p><p>'
) || '</p>'
where description <> '';

drop table public.recipe_comment;
