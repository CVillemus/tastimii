/** Recette telle qu'affichée dans la liste. */
export type RecipeSummary = {
  id: string;
  title: string;
  baseServings: number;
  preparationMinutes: number | null;
};

/** Ingrédient d'une recette, pour son nombre de parts de base. `quantity` vide = « au goût ». */
export type RecipeIngredientLine = {
  ingredientId: string;
  ingredientName: string;
  quantity: number | null;
  unit: string;
};

/** Recette complète, pour la page de détail et le formulaire de modification. */
export type Recipe = RecipeSummary & {
  steps: string[];
  /** Description libre en texte riche (HTML), affichée en tête de la recette. */
  descriptionHtml: string;
  ingredientLines: RecipeIngredientLine[];
};

/** Ce qu'on envoie à la base pour créer ou modifier une recette. */
export type RecipeDraft = {
  title: string;
  baseServings: number;
  preparationMinutes: number | null;
  steps: string[];
  descriptionHtml: string;
  ingredientLines: RecipeDraftIngredientLine[];
};

export type RecipeDraftIngredientLine = {
  ingredientId: string;
  quantity: number | null;
  unit: string;
};
