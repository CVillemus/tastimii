import { RecipeSummary } from '../recipes/recipe.model';

/** Une recette en cuisine : les courses sont faites, il reste à la cuisiner. */
export type KitchenRecipe = {
  /** Identifiant de la ligne en cuisine (une même recette peut y être deux fois). */
  kitchenEntryId: string;
  recipe: RecipeSummary;
  servings: number;
  /** Date à laquelle les courses ont été validées. */
  addedAt: string;
};
