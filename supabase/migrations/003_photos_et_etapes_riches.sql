-- Tastimii : une photo par recette, et des étapes avec un titre et un texte riche.
-- À coller dans Supabase → SQL Editor → Run.
--
-- Ce script ne casse pas la version en ligne : il AJOUTE des colonnes sans rien supprimer.
-- L'ancienne colonne `steps` reste en place jusqu'à un prochain script de nettoyage.

-- ---------------------------------------------------------------------------
-- Étapes : [{ "title": "Faire la préparation", "content_html": "<p>Mélanger…</p>" }, …]
-- ---------------------------------------------------------------------------

alter table public.recipe
  add column preparation_steps jsonb not null default '[]'::jsonb;

-- Reprise des étapes existantes : sans titre, le texte devient un paragraphe.
update public.recipe
set preparation_steps = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object(
        'title', '',
        'content_html', '<p>' || replace(
          replace(replace(replace(old_step.step_text, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'),
          E'\n',
          '<br>'
        ) || '</p>'
      )
      order by old_step.step_position
    )
    from unnest(recipe.steps) with ordinality as old_step(step_text, step_position)
    where trim(old_step.step_text) <> ''
  ),
  '[]'::jsonb
);

-- ---------------------------------------------------------------------------
-- Photos : le fichier est dans Storage, la recette garde son chemin.
-- ---------------------------------------------------------------------------

alter table public.recipe
  add column photo_path text;

-- Dossier public des photos (5 Mo maximum par fichier, l'app les réduit avant l'envoi).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-photos', 'recipe-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Comme le reste de l'app : tout le monde peut tout faire sur les photos.
create policy "photos de recettes : lecture pour tous"
  on storage.objects for select to anon
  using (bucket_id = 'recipe-photos');

create policy "photos de recettes : ajout pour tous"
  on storage.objects for insert to anon
  with check (bucket_id = 'recipe-photos');

create policy "photos de recettes : modification pour tous"
  on storage.objects for update to anon
  using (bucket_id = 'recipe-photos')
  with check (bucket_id = 'recipe-photos');

create policy "photos de recettes : suppression pour tous"
  on storage.objects for delete to anon
  using (bucket_id = 'recipe-photos');
