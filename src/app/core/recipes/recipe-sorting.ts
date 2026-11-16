/** Critère de tri de la liste des recettes. */
export type RecipeSortField = 'title' | 'createdAt';

export type SortDirection = 'ascending' | 'descending';

/** Tri de la liste : un critère et un sens (flèche ↑ croissant, ↓ décroissant). */
export type RecipeSort = {
  field: RecipeSortField;
  direction: SortDirection;
};

export const DEFAULT_RECIPE_SORT: RecipeSort = { field: 'title', direction: 'ascending' };

/** Sens proposé quand on choisit un critère : A → Z pour le nom, les plus récentes pour la date. */
const DEFAULT_DIRECTION_BY_FIELD: Record<RecipeSortField, SortDirection> = {
  title: 'ascending',
  createdAt: 'descending',
};

/**
 * Comme dans un tableau : cliquer sur le critère déjà actif inverse le sens ; cliquer sur un autre
 * critère le choisit, dans son sens habituel.
 */
export function chooseRecipeSort(
  currentSort: RecipeSort,
  clickedField: RecipeSortField,
): RecipeSort {
  if (currentSort.field === clickedField) {
    return {
      field: clickedField,
      direction: currentSort.direction === 'ascending' ? 'descending' : 'ascending',
    };
  }
  return { field: clickedField, direction: DEFAULT_DIRECTION_BY_FIELD[clickedField] };
}

/** Ce qu'il faut d'une recette pour la trier. */
type SortableRecipe = {
  title: string;
  createdAt: string;
};

/**
 * Trie sans modifier la liste reçue. Les titres se comparent sans tenir compte des accents ni des
 * majuscules (« Œuf » avec les O) ; à date égale, on départage par titre (toujours de A à Z).
 */
export function sortRecipes<TRecipe extends SortableRecipe>(
  recipes: readonly TRecipe[],
  recipeSort: RecipeSort,
): TRecipe[] {
  const compareTitles = (firstRecipe: TRecipe, secondRecipe: TRecipe): number =>
    firstRecipe.title.localeCompare(secondRecipe.title, 'fr', { sensitivity: 'base' });
  const directionFactor: number = recipeSort.direction === 'ascending' ? 1 : -1;
  return [...recipes].sort((firstRecipe: TRecipe, secondRecipe: TRecipe) => {
    if (recipeSort.field === 'createdAt') {
      const byDate: number = firstRecipe.createdAt.localeCompare(secondRecipe.createdAt);
      return byDate !== 0 ? byDate * directionFactor : compareTitles(firstRecipe, secondRecipe);
    }
    return compareTitles(firstRecipe, secondRecipe) * directionFactor;
  });
}

/** Lecture d'un tri enregistré (« title:ascending »), avec le tri par défaut si la valeur est inconnue. */
export function parseRecipeSort(storedSort: string | null): RecipeSort {
  const [field, direction] = (storedSort ?? '').split(':');
  const isField: boolean = field === 'title' || field === 'createdAt';
  const isDirection: boolean = direction === 'ascending' || direction === 'descending';
  return isField && isDirection
    ? { field: field as RecipeSortField, direction: direction as SortDirection }
    : DEFAULT_RECIPE_SORT;
}

export function serializeRecipeSort(recipeSort: RecipeSort): string {
  return `${recipeSort.field}:${recipeSort.direction}`;
}
