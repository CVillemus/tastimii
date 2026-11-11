-- Tastimii : un ingrédient a directement son type (Viande, Crèmerie…), qui est aussi son rayon
-- dans la liste de courses. Fini l'arbre « Cuisses de poulet → Poulet → Viande ».
-- À coller dans Supabase → SQL Editor → Run.
--
-- La table garde son nom `ingredient_family` (une ligne = un type) et la colonne
-- `parent_family_id` reste pour l'instant : l'ancienne version du site continue de marcher.
-- La colonne sera supprimée dans un prochain script de nettoyage.

-- 1. Chaque ingrédient rangé dans une sous-famille passe dans le type tout en haut de son arbre.
--    Exemple : « Jambon », rangé dans « Poulet » (sous « Viande »), passe dans « Viande ».
with recursive family_with_type as (
  select id, id as type_id
  from public.ingredient_family
  where parent_family_id is null
  union all
  select child_family.id, family_with_type.type_id
  from public.ingredient_family as child_family
  join family_with_type on child_family.parent_family_id = family_with_type.id
)
update public.ingredient
set family_id = family_with_type.type_id
from family_with_type
where ingredient.family_id = family_with_type.id
  and family_with_type.type_id <> family_with_type.id;

-- 2. Les sous-familles, désormais vides, sont supprimées (des plus profondes vers le haut).
do $$
begin
  loop
    delete from public.ingredient_family as sub_family
    where sub_family.parent_family_id is not null
      and not exists (
        select 1 from public.ingredient_family as child_family
        where child_family.parent_family_id = sub_family.id
      )
      and not exists (
        select 1 from public.ingredient
        where ingredient.family_id = sub_family.id
      );
    exit when not found;
  end loop;
end $$;

-- 3. Plus de sous-types : un type n'a jamais de parent.
alter table public.ingredient_family
  add constraint ingredient_family_sans_parent check (parent_family_id is null);

comment on table public.ingredient_family is
  'Types d''ingrédients (Viande, Crèmerie…) : un type = un rayon de la liste de courses.';
