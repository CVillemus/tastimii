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
  /** Souvent à la maison (sel, beurre…) : à vérifier avant les courses, pas à acheter d'office. */
  isUsuallyAtHome: boolean;
};

/** Ce qu'on peut modifier sur un ingrédient depuis la page de gestion. */
export type IngredientChanges = {
  name: string;
  typeId: string;
  defaultUnit: string;
  isUsuallyAtHome: boolean;
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

/**
 * Unités proposées dans les formulaires. Poids et volumes toujours dans la plus petite unité
 * (g, ml) : l'affichage passe tout seul en kg, cl ou l (voir `toReadableQuantity`).
 */
export const SUGGESTED_UNITS: readonly string[] = [
  'g',
  'ml',
  'c. à soupe',
  'c. à café',
  'pincée',
  'gousse',
  'brin',
  'tranche',
  'boîte',
  'sachet',
];
