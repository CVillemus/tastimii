/** Type d'ingrédient (Viande, Crèmerie…) : c'est aussi son rayon dans la liste de courses. */
export type IngredientType = {
  id: string;
  name: string;
};

/** Ingrédient rangé directement dans son type : « Cuisses de poulet » → « Viande ». */
export type Ingredient = {
  id: string;
  name: string;
  typeId: string;
  defaultUnit: string;
};

/** Catalogue complet, chargé en une fois : il reste petit (deux utilisateurs). */
export type IngredientCatalog = {
  types: IngredientType[];
  ingredients: Ingredient[];
};

/** Un type et ses ingrédients, pour la page de gestion. */
export type IngredientTypeGroup = {
  ingredientType: IngredientType;
  ingredients: Ingredient[];
};

/** Unités proposées dans les formulaires (on peut en taper d'autres). */
export const SUGGESTED_UNITS: readonly string[] = [
  'g',
  'kg',
  'ml',
  'cl',
  'l',
  'c. à soupe',
  'c. à café',
  'pincée',
  'gousse',
  'brin',
  'tranche',
  'boîte',
  'sachet',
];
