-- Tastimii : l'origine d'une recette (un lien web, un livre comme « Saveurs », une personne…).
-- Donne une idée de la difficulté. Texte libre ; affiché comme lien si c'est une adresse web.
-- À coller dans Supabase → SQL Editor → Run.
--
-- Ce script ne casse pas la version en ligne : il ajoute une colonne, vide par défaut.

alter table public.recipe
  add column origin text not null default '';

comment on column public.recipe.origin is
  'Origine de la recette : lien web, livre, personne… Vide = non renseignée.';
