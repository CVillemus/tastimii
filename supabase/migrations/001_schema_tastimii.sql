-- Schéma de Tastimii : recettes, ingrédients rangés par familles, liste de courses.
-- À coller dans Supabase → SQL Editor → Run.
--
-- Pas de comptes : seuls Corentin et Marine connaissent l'adresse du site.
-- Les règles RLS ci-dessous laissent donc tout faire au rôle « anon » (la clé publique du front).

-- Familles d'ingrédients, en arbre : Viande → Poulet. Une famille sans parent est un rayon.
create table public.ingredient_family (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  parent_family_id uuid references public.ingredient_family (id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Ingrédients : « Cuisses de poulet » appartient à la famille « Poulet ».
create table public.ingredient (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  family_id uuid not null references public.ingredient_family (id) on delete restrict,
  default_unit text not null default '',
  created_at timestamptz not null default now()
);

-- Recettes. Les étapes sont un tableau de textes, dans l'ordre.
create table public.recipe (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  base_servings integer not null check (base_servings > 0),
  preparation_minutes integer check (preparation_minutes > 0),
  steps text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ingrédients d'une recette, pour son nombre de parts de base.
-- Une quantité vide veut dire « au goût » (sel, poivre…).
create table public.recipe_ingredient (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipe (id) on delete cascade,
  ingredient_id uuid not null references public.ingredient (id) on delete restrict,
  quantity numeric check (quantity > 0),
  unit text not null default '',
  position integer not null
);

create index recipe_ingredient_recipe_id_idx on public.recipe_ingredient (recipe_id);

-- Commentaires sur une recette (sans auteur : ils sont de Corentin, de Marine ou des deux).
create table public.recipe_comment (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipe (id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index recipe_comment_recipe_id_idx on public.recipe_comment (recipe_id);

-- Recettes au menu de la liste de courses, avec le nombre de parts voulu.
create table public.shopping_list_recipe (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipe (id) on delete cascade,
  servings integer not null check (servings > 0),
  added_at timestamptz not null default now()
);

-- Lignes cochées de la liste de courses. Une ligne = un ingrédient dans une unité :
-- la clé vaut « <ingredient_id>|<unité> ».
create table public.shopping_list_checked_line (
  line_key text primary key,
  checked_at timestamptz not null default now()
);

-- Accès complet pour le front (clé publique) : pas de sécurité voulue.
grant usage on schema public to anon;
grant select, insert, update, delete on all tables in schema public to anon;

alter table public.ingredient_family enable row level security;
alter table public.ingredient enable row level security;
alter table public.recipe enable row level security;
alter table public.recipe_ingredient enable row level security;
alter table public.recipe_comment enable row level security;
alter table public.shopping_list_recipe enable row level security;
alter table public.shopping_list_checked_line enable row level security;

create policy "tout le monde peut tout faire" on public.ingredient_family for all to anon using (true) with check (true);
create policy "tout le monde peut tout faire" on public.ingredient for all to anon using (true) with check (true);
create policy "tout le monde peut tout faire" on public.recipe for all to anon using (true) with check (true);
create policy "tout le monde peut tout faire" on public.recipe_ingredient for all to anon using (true) with check (true);
create policy "tout le monde peut tout faire" on public.recipe_comment for all to anon using (true) with check (true);
create policy "tout le monde peut tout faire" on public.shopping_list_recipe for all to anon using (true) with check (true);
create policy "tout le monde peut tout faire" on public.shopping_list_checked_line for all to anon using (true) with check (true);

-- Quelques familles pour démarrer (rayons, puis sous-familles).
insert into public.ingredient_family (name) values
  ('Viande'), ('Poisson'), ('Fruits et légumes'), ('Crèmerie'), ('Épicerie'), ('Herbes et épices'), ('Boulangerie'), ('Surgelés');

insert into public.ingredient_family (name, parent_family_id)
select 'Poulet', id from public.ingredient_family where name = 'Viande';
