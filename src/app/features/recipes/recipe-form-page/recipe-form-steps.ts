import {
  createEmptyRecipeFormModel,
  normalizeIngredientName,
  RecipeFormIngredientLine,
  RecipeFormModel,
  RecipeFormStep,
} from './recipe-form.model';

/**
 * Le formulaire de recette se remplit en trois étapes :
 * 1. Infos (titre, parts, durée, origine, photo, tags) ;
 * 2. Ingrédients ;
 * 3. Préparation (les étapes, puis les astuces et variantes).
 */
export type RecipeFormStepNumber = 1 | 2 | 3;

export type RecipeFormStepDefinition = {
  stepNumber: RecipeFormStepNumber;
  label: string;
};

export const RECIPE_FORM_STEPS: readonly RecipeFormStepDefinition[] = [
  { stepNumber: 1, label: 'Infos' },
  { stepNumber: 2, label: 'Ingrédients' },
  { stepNumber: 3, label: 'Préparation' },
];

export const FIRST_RECIPE_FORM_STEP: RecipeFormStepNumber = 1;
export const LAST_RECIPE_FORM_STEP: RecipeFormStepNumber = 3;

/** Étape lue dans l'adresse (`?etape=2`) ; la première si la valeur est absente ou inconnue. */
export function parseRecipeFormStep(queryValue: string | undefined): RecipeFormStepNumber {
  const stepNumber: number = Number(queryValue);
  return stepNumber === 2 || stepNumber === 3 ? stepNumber : FIRST_RECIPE_FORM_STEP;
}

/** Vrai si au moins une ligne d'ingrédient a un nom. */
export function hasNamedIngredientLine(
  ingredientLines: readonly RecipeFormIngredientLine[],
): boolean {
  return ingredientLines.some(
    (ingredientLine: RecipeFormIngredientLine) =>
      normalizeIngredientName(ingredientLine.ingredientName).length > 0,
  );
}

/**
 * Vrai si au moins une étape a un texte. Un titre seul ne suffit pas : les quatre étapes proposées
 * au départ ont déjà un titre (« Le coup de feu »…) mais pas encore de texte.
 */
export function hasStepWithText(steps: readonly RecipeFormStep[]): boolean {
  return steps.some((step: RecipeFormStep) => toPlainText(step.contentHtml).length > 0);
}

/** Texte visible d'un contenu riche : sans balises ni espaces insécables. */
function toPlainText(contentHtml: string): string {
  return contentHtml
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** Brouillon de la nouvelle recette, gardé sur l'appareil tant qu'elle n'est pas enregistrée. */
export const RECIPE_DRAFT_STORAGE_KEY: string = 'tastimii.recipe-draft';

export function serializeRecipeDraft(recipeFormModel: RecipeFormModel): string {
  return JSON.stringify(recipeFormModel);
}

/**
 * Relit un brouillon enregistré. `null` s'il n'y en a pas, s'il est illisible ou s'il ne
 * ressemble pas à un formulaire de recette (ancienne version de l'app, valeur abîmée…).
 */
export function parseRecipeDraft(storedDraft: string | null): RecipeFormModel | null {
  if (storedDraft === null) {
    return null;
  }
  try {
    const parsedDraft: unknown = JSON.parse(storedDraft);
    if (!looksLikeRecipeFormModel(parsedDraft)) {
      return null;
    }
    // Les champs absents (ajoutés depuis) reprennent leur valeur de départ.
    return { ...createEmptyRecipeFormModel(), ...parsedDraft };
  } catch {
    return null;
  }
}

function looksLikeRecipeFormModel(value: unknown): value is RecipeFormModel {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const draft: Partial<Record<keyof RecipeFormModel, unknown>> = value;
  return (
    typeof draft.title === 'string' &&
    Array.isArray(draft.ingredientLines) &&
    Array.isArray(draft.steps) &&
    Array.isArray(draft.tagIds)
  );
}

/** Vrai si rien n'a encore été saisi : pas besoin de garder un brouillon. */
export function isUntouchedRecipeFormModel(recipeFormModel: RecipeFormModel): boolean {
  return (
    serializeRecipeDraft(recipeFormModel) === serializeRecipeDraft(createEmptyRecipeFormModel())
  );
}
