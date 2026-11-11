import { RecipeDraftIngredientLine } from '../recipes/recipe.model';

/** Recette mise au menu des courses, avec le nombre de parts voulu. */
export type ShoppingListMenuRecipe = {
  menuEntryId: string;
  recipeId: string;
  recipeTitle: string;
  baseServings: number;
  wantedServings: number;
  ingredientLines: RecipeDraftIngredientLine[];
};

/** Une ligne à acheter : un ingrédient dans une unité, toutes recettes confondues. */
export type ShoppingListLine = {
  lineKey: string;
  ingredientName: string;
  quantity: number | null;
  unit: string;
  isChecked: boolean;
};

/** Un rayon du magasin (le type des ingrédients) et ses lignes. */
export type ShoppingListAisle = {
  ingredientTypeId: string;
  aisleName: string;
  lines: ShoppingListLine[];
};

/** Tout ce que la page des courses affiche. */
export type ShoppingList = {
  menuRecipes: ShoppingListMenuRecipe[];
  aisles: ShoppingListAisle[];
};
