/** Un tag de recette : « Rapide », « Peu de vaisselle », « Préparation en avance »… */
export type RecipeTag = {
  id: string;
  name: string;
};

export function compareTagsByName(firstTag: RecipeTag, secondTag: RecipeTag): number {
  return firstTag.name.localeCompare(secondTag.name, 'fr', { sensitivity: 'base' });
}

/** Comparaison de noms de tags sans tenir compte des majuscules ni des espaces autour. */
export function normalizeTagName(tagName: string): string {
  return tagName.trim().toLocaleLowerCase('fr');
}

/**
 * Garde les recettes qui ont TOUS les tags choisis (« Rapide » + « Peu de vaisselle »).
 * Sans tag choisi, toutes les recettes restent.
 */
export function filterBySelectedTags<TaggedItem extends { tags: RecipeTag[] }>(
  taggedItems: TaggedItem[],
  selectedTagIds: ReadonlySet<string>,
): TaggedItem[] {
  if (selectedTagIds.size === 0) {
    return taggedItems;
  }
  return taggedItems.filter((taggedItem: TaggedItem) => {
    const itemTagIds: Set<string> = new Set(taggedItem.tags.map((tag: RecipeTag) => tag.id));
    return [...selectedTagIds].every((selectedTagId: string) => itemTagIds.has(selectedTagId));
  });
}

/** Tags portés par au moins une recette, triés par nom : ceux qu'on propose comme filtres. */
export function collectUsedTags(taggedItems: { tags: RecipeTag[] }[]): RecipeTag[] {
  const usedTagsById: Map<string, RecipeTag> = new Map();
  for (const taggedItem of taggedItems) {
    for (const tag of taggedItem.tags) {
      usedTagsById.set(tag.id, tag);
    }
  }
  return [...usedTagsById.values()].sort(compareTagsByName);
}
