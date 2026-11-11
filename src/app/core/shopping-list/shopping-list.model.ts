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

/** Ce qu'une recette du menu demande d'un ingrédient « souvent à la maison ». */
export type AtHomeCheckNeed = {
  recipeTitle: string;
  quantity: number | null;
  unit: string;
};

/**
 * Ingrédient « souvent à la maison » à vérifier avant de partir (« Beurre : 250 g pour le gâteau »).
 * Coché « à acheter » (`isToBuy`), il rejoint aussi son rayon dans la liste.
 */
export type AtHomeCheckItem = {
  ingredientId: string;
  ingredientName: string;
  toBuyKey: string;
  isToBuy: boolean;
  needs: AtHomeCheckNeed[];
};

/** Tout ce que la page des courses affiche. */
export type ShoppingList = {
  menuRecipes: ShoppingListMenuRecipe[];
  itemsToCheckAtHome: AtHomeCheckItem[];
  aisles: ShoppingListAisle[];
};
