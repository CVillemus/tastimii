/** Ordre de la liste des recettes. */
export type RecipeSortOrder = 'alphabetical' | 'newest';

/** Ce qu'il faut d'une recette pour la trier. */
type SortableRecipe = {
  title: string;
  createdAt: string;
};

/**
 * Trie sans modifier la liste reçue :
 * - `alphabetical` : de A à Z, sans tenir compte des accents ni des majuscules (« Œuf » avec les O) ;
 * - `newest` : les dernières recettes ajoutées d'abord (à date égale, par titre).
 */
export function sortRecipes<TRecipe extends SortableRecipe>(
  recipes: readonly TRecipe[],
  sortOrder: RecipeSortOrder,
): TRecipe[] {
  const compareTitles = (firstRecipe: TRecipe, secondRecipe: TRecipe): number =>
    firstRecipe.title.localeCompare(secondRecipe.title, 'fr', { sensitivity: 'base' });
  return [...recipes].sort((firstRecipe: TRecipe, secondRecipe: TRecipe) => {
    if (sortOrder === 'newest') {
      const newestFirst: number = secondRecipe.createdAt.localeCompare(firstRecipe.createdAt);
      return newestFirst !== 0 ? newestFirst : compareTitles(firstRecipe, secondRecipe);
    }
    return compareTitles(firstRecipe, secondRecipe);
  });
}
