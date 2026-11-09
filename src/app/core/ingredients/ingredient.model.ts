/** Famille d'ingrédients. Une famille sans parent est un rayon du magasin (Viande, Crèmerie…). */
export type IngredientFamily = {
  id: string;
  name: string;
  parentFamilyId: string | null;
};

/** Ingrédient rangé dans une famille : « Cuisses de poulet » → « Poulet ». */
export type Ingredient = {
  id: string;
  name: string;
  familyId: string;
  defaultUnit: string;
};

/** Catalogue complet, chargé en une fois : il reste petit (deux utilisateurs). */
export type IngredientCatalog = {
  families: IngredientFamily[];
  ingredients: Ingredient[];
};

/** Famille affichée dans l'arbre, avec sa profondeur (0 = rayon) et ses ingrédients. */
export type IngredientFamilyTreeEntry = {
  family: IngredientFamily;
  depth: number;
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
