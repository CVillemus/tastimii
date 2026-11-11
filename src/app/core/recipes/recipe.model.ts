import { RecipeTag } from '../tags/tag.model';

/** Recette telle qu'affichée dans la liste. */
export type RecipeSummary = {
  id: string;
  title: string;
  baseServings: number;
  preparationMinutes: number | null;
  /** Adresse publique de la photo, ou `null` si la recette n'en a pas. */
  photoUrl: string | null;
  /** Tags de la recette, triés par nom. */
  tags: RecipeTag[];
};

/** Une étape de préparation : un titre court (facultatif) et un texte riche (HTML). */
export type RecipeStep = {
  title: string;
  contentHtml: string;
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
  /** Chemin de la photo dans Storage, pour la remplacer ou la supprimer. */
  photoPath: string | null;
  steps: RecipeStep[];
  /** Description libre en texte riche (HTML), affichée en tête de la recette. */
  descriptionHtml: string;
  ingredientLines: RecipeIngredientLine[];
};

/** Ce qu'on envoie à la base pour créer ou modifier une recette. */
export type RecipeDraft = {
  title: string;
  baseServings: number;
  preparationMinutes: number | null;
  steps: RecipeStep[];
  descriptionHtml: string;
  ingredientLines: RecipeDraftIngredientLine[];
  tagIds: string[];
};

export type RecipeDraftIngredientLine = {
  ingredientId: string;
  quantity: number | null;
  unit: string;
};
