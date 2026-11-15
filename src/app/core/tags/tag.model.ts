/** Catégorie d'un tag : le type de plat, la saison ou l'envie. */
export type TagCategory = 'type_de_plat' | 'saison' | 'envie';

/** Un tag de recette : « Pâtes » (type de plat), « Hiver » (saison), « Réconfortant » (envie)… */
export type RecipeTag = {
  id: string;
  name: string;
  category: TagCategory;
};

/** Ce que l'app sait d'une catégorie : son libellé, son emoji, et si on n'y choisit qu'un tag. */
export type TagCategoryDefinition = {
  category: TagCategory;
  label: string;
  emoji: string;
  /** Saison : au plus un tag par recette (aucun = toute l'année). */
  isSingleChoice: boolean;
  /** Ce que veut dire « aucun tag de cette catégorie » (« Toute l'année »), s'il y a un sens. */
  noTagLabel: string | null;
};

/** Les catégories, dans l'ordre d'affichage. */
export const TAG_CATEGORIES: readonly TagCategoryDefinition[] = [
  {
    category: 'type_de_plat',
    label: 'Type de plat',
    emoji: '🍲',
    isSingleChoice: false,
    noTagLabel: null,
  },
  {
    category: 'saison',
    label: 'Saison',
    emoji: '🌦️',
    isSingleChoice: true,
    noTagLabel: "Toute l'année",
  },
  { category: 'envie', label: 'Envie', emoji: '✨', isSingleChoice: false, noTagLabel: null },
];

/** Une catégorie et ses tags, triés par nom. */
export type TagCategoryGroup = {
  definition: TagCategoryDefinition;
  tags: RecipeTag[];
};

export function compareTagsByName(firstTag: RecipeTag, secondTag: RecipeTag): number {
  return firstTag.name.localeCompare(secondTag.name, 'fr', { sensitivity: 'base' });
}

/** Comparaison de noms de tags sans tenir compte des majuscules ni des espaces autour. */
export function normalizeTagName(tagName: string): string {
  return tagName.trim().toLocaleLowerCase('fr');
}

export function findTagCategoryDefinition(category: TagCategory): TagCategoryDefinition {
  return (
    TAG_CATEGORIES.find((definition: TagCategoryDefinition) => definition.category === category) ??
    TAG_CATEGORIES[TAG_CATEGORIES.length - 1]
  );
}

/**
 * Les tags rangés par catégorie, dans l'ordre des catégories, triés par nom.
 * `keepEmptyCategories` : garder une catégorie sans tag (pour la page de gestion).
 */
export function groupTagsByCategory(
  tags: readonly RecipeTag[],
  keepEmptyCategories: boolean = false,
): TagCategoryGroup[] {
  return TAG_CATEGORIES.map((definition: TagCategoryDefinition): TagCategoryGroup => ({
    definition,
    tags: tags
      .filter((tag: RecipeTag) => tag.category === definition.category)
      .sort(compareTagsByName),
  })).filter(
    (tagCategoryGroup: TagCategoryGroup) => keepEmptyCategories || tagCategoryGroup.tags.length > 0,
  );
}

/**
 * Coche ou décoche un tag sur une recette. Dans une catégorie à choix unique (saison), cocher un
 * tag décoche les autres de la même catégorie.
 */
export function toggleRecipeTag(
  selectedTagIds: readonly string[],
  toggledTag: RecipeTag,
  allTags: readonly RecipeTag[],
): string[] {
  if (selectedTagIds.includes(toggledTag.id)) {
    return selectedTagIds.filter((selectedTagId: string) => selectedTagId !== toggledTag.id);
  }
  if (!findTagCategoryDefinition(toggledTag.category).isSingleChoice) {
    return [...selectedTagIds, toggledTag.id];
  }
  const sameCategoryTagIds: Set<string> = new Set(
    allTags
      .filter((tag: RecipeTag) => tag.category === toggledTag.category)
      .map((tag: RecipeTag) => tag.id),
  );
  return [
    ...selectedTagIds.filter((selectedTagId: string) => !sameCategoryTagIds.has(selectedTagId)),
    toggledTag.id,
  ];
}

/**
 * Filtre les recettes selon les tags choisis, catégorie par catégorie (toutes doivent être
 * respectées) :
 * - type de plat : la recette a l'un des types choisis (Pâtes ou Soupe) ;
 * - saison : la recette est de cette saison, ou de toute l'année (aucun tag de saison) ;
 * - envie : la recette a toutes les envies choisies (Végétarien et Pour recevoir).
 * Sans tag choisi, toutes les recettes restent.
 */
export function filterByTagSelection<TaggedItem extends { tags: RecipeTag[] }>(
  taggedItems: readonly TaggedItem[],
  selectedTags: readonly RecipeTag[],
): TaggedItem[] {
  const selectedTagIdsByCategory: Map<TagCategory, Set<string>> = new Map();
  for (const selectedTag of selectedTags) {
    const categoryTagIds: Set<string> =
      selectedTagIdsByCategory.get(selectedTag.category) ?? new Set<string>();
    categoryTagIds.add(selectedTag.id);
    selectedTagIdsByCategory.set(selectedTag.category, categoryTagIds);
  }

  return taggedItems.filter((taggedItem: TaggedItem) =>
    [...selectedTagIdsByCategory.entries()].every(
      ([category, categoryTagIds]: [TagCategory, Set<string>]) => {
        const itemCategoryTagIds: string[] = taggedItem.tags
          .filter((tag: RecipeTag) => tag.category === category)
          .map((tag: RecipeTag) => tag.id);
        if (category === 'envie') {
          return [...categoryTagIds].every((tagId: string) => itemCategoryTagIds.includes(tagId));
        }
        if (category === 'saison' && itemCategoryTagIds.length === 0) {
          return true;
        }
        return itemCategoryTagIds.some((tagId: string) => categoryTagIds.has(tagId));
      },
    ),
  );
}

/** Tags portés par au moins une recette, triés par nom : ceux qu'on propose comme filtres. */
export function collectUsedTags(taggedItems: readonly { tags: RecipeTag[] }[]): RecipeTag[] {
  const usedTagsById: Map<string, RecipeTag> = new Map();
  for (const taggedItem of taggedItems) {
    for (const tag of taggedItem.tags) {
      usedTagsById.set(tag.id, tag);
    }
  }
  return [...usedTagsById.values()].sort(compareTagsByName);
}

/** Tags d'une recette dans l'ordre des catégories (type de plat, saison, envie), puis par nom. */
export function sortTagsByCategory(tags: readonly RecipeTag[]): RecipeTag[] {
  return groupTagsByCategory(tags).flatMap(
    (tagCategoryGroup: TagCategoryGroup) => tagCategoryGroup.tags,
  );
}
