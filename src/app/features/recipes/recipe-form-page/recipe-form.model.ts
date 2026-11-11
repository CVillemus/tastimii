import { Recipe, RecipeIngredientLine, RecipeStep } from '../../../core/recipes/recipe.model';
import { RecipeTag } from '../../../core/tags/tag.model';

/** Valeurs du formulaire de recette (Signal Forms). */
export type RecipeFormModel = {
  title: string;
  baseServings: number;
  preparationMinutes: number | null;
  ingredientLines: RecipeFormIngredientLine[];
  steps: RecipeFormStep[];
  /** Description libre en texte riche (HTML). */
  descriptionHtml: string;
  /** Identifiants des tags choisis. */
  tagIds: string[];
};

/**
 * Une ligne d'ingrédient du formulaire. On tape le nom : s'il n'existe pas encore,
 * on choisit son type (`newIngredientTypeId`) et il est créé à l'enregistrement.
 */
export type RecipeFormIngredientLine = {
  ingredientName: string;
  quantity: number | null;
  unit: string;
  newIngredientTypeId: string;
};

/** Une étape du formulaire : un titre court facultatif et un texte riche (HTML). */
export type RecipeFormStep = {
  title: string;
  contentHtml: string;
};

export const DEFAULT_BASE_SERVINGS: number = 4;

export function createEmptyIngredientLine(): RecipeFormIngredientLine {
  return { ingredientName: '', quantity: null, unit: '', newIngredientTypeId: '' };
}

export function createEmptyStep(): RecipeFormStep {
  return { title: '', contentHtml: '' };
}

export function createEmptyRecipeFormModel(): RecipeFormModel {
  return {
    title: '',
    baseServings: DEFAULT_BASE_SERVINGS,
    preparationMinutes: null,
    ingredientLines: [createEmptyIngredientLine()],
    steps: [createEmptyStep()],
    descriptionHtml: '',
    tagIds: [],
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
              newIngredientTypeId: '',
            }),
          )
        : [createEmptyIngredientLine()],
    steps:
      recipe.steps.length > 0
        ? recipe.steps.map((recipeStep: RecipeStep): RecipeFormStep => ({
            title: recipeStep.title,
            contentHtml: recipeStep.contentHtml,
          }))
        : [createEmptyStep()],
    descriptionHtml: recipe.descriptionHtml,
    tagIds: recipe.tags.map((recipeTag: RecipeTag) => recipeTag.id),
  };
}

/** Une étape est gardée si elle a un titre ou un texte. */
export function isFilledStep(formStep: RecipeFormStep): boolean {
  return formStep.title.trim().length > 0 || formStep.contentHtml.length > 0;
}

/** Comparaison de noms d'ingrédients sans tenir compte des majuscules ni des espaces autour. */
export function normalizeIngredientName(ingredientName: string): string {
  return ingredientName.trim().toLocaleLowerCase('fr');
}
