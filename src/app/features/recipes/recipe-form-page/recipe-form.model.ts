import { Recipe, RecipeIngredientLine } from '../../../core/recipes/recipe.model';

/** Valeurs du formulaire de recette (Signal Forms). */
export type RecipeFormModel = {
  title: string;
  baseServings: number;
  preparationMinutes: number | null;
  ingredientLines: RecipeFormIngredientLine[];
  steps: RecipeFormStep[];
  notes: string;
};

/**
 * Une ligne d'ingrédient du formulaire. On tape le nom : s'il n'existe pas encore,
 * on choisit sa famille (`newIngredientFamilyId`) et il est créé à l'enregistrement.
 */
export type RecipeFormIngredientLine = {
  ingredientName: string;
  quantity: number | null;
  unit: string;
  newIngredientFamilyId: string;
};

export type RecipeFormStep = {
  instruction: string;
};

export const DEFAULT_BASE_SERVINGS: number = 4;

export function createEmptyIngredientLine(): RecipeFormIngredientLine {
  return { ingredientName: '', quantity: null, unit: '', newIngredientFamilyId: '' };
}

export function createEmptyStep(): RecipeFormStep {
  return { instruction: '' };
}

export function createEmptyRecipeFormModel(): RecipeFormModel {
  return {
    title: '',
    baseServings: DEFAULT_BASE_SERVINGS,
    preparationMinutes: null,
    ingredientLines: [createEmptyIngredientLine()],
    steps: [createEmptyStep()],
    notes: '',
  };
}

/** Remplit le formulaire avec une recette existante (mode modification). */
export function toRecipeFormModel(recipe: Recipe): RecipeFormModel {
  return {
    title: recipe.title,
    baseServings: recipe.baseServings,
    preparationMinutes: recipe.preparationMinutes,
    ingredientLines:
      recipe.ingredientLines.length > 0
        ? recipe.ingredientLines.map(
            (ingredientLine: RecipeIngredientLine): RecipeFormIngredientLine => ({
              ingredientName: ingredientLine.ingredientName,
              quantity: ingredientLine.quantity,
              unit: ingredientLine.unit,
              newIngredientFamilyId: '',
            }),
          )
        : [createEmptyIngredientLine()],
    steps:
      recipe.steps.length > 0
        ? recipe.steps.map((instruction: string): RecipeFormStep => ({ instruction }))
        : [createEmptyStep()],
    notes: recipe.notes,
  };
}

/** Comparaison de noms d'ingrédients sans tenir compte des majuscules ni des espaces autour. */
export function normalizeIngredientName(ingredientName: string): string {
  return ingredientName.trim().toLocaleLowerCase('fr');
}
