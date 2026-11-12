import { formatUnit } from '../../../core/recipes/quantity';
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
 * `unit` est le choix de la liste : une unité (« g »), `COUNT_UNIT_CHOICE` ou `NO_UNIT_CHOICE`.
 */
export type RecipeFormIngredientLine = {
  ingredientName: string;
  quantity: number | null;
  unit: string;
  newIngredientTypeId: string;
};

/** Choix d'unité proposé dans la liste déroulante. */
export type UnitChoice = {
  value: string;
  label: string;
};

/** « nb » (nombre) : on compte les ingrédients (4 diots). Stocké comme une unité vide. */
export const COUNT_UNIT_CHOICE: string = '';

/**
 * « Aucune unité » : ni unité ni quantité (sel, poivre…), affiché « au goût ».
 * N'existe que dans le formulaire : en base, c'est une unité vide sans quantité.
 */
export const NO_UNIT_CHOICE: string = 'aucune-unite';

/** Les deux choix sans unité en tête de liste, puis les unités habituelles. */
export function buildUnitChoices(suggestedUnits: readonly string[]): UnitChoice[] {
  return [
    { value: COUNT_UNIT_CHOICE, label: 'nb' },
    { value: NO_UNIT_CHOICE, label: 'Aucune unité (au goût)' },
    ...suggestedUnits.map((suggestedUnit: string): UnitChoice => ({
      value: suggestedUnit,
      label: suggestedUnit,
    })),
  ];
}

/** Choix d'unité d'une ligne enregistrée : une unité vide sans quantité, c'est « Aucune unité ». */
export function toUnitChoice(quantity: number | null, unit: string): string {
  if (unit.trim().length > 0) {
    // « ml » → « mL », « c. à soupe » → « cs » : la forme proposée dans la liste.
    return formatUnit(unit);
  }
  return quantity === null ? NO_UNIT_CHOICE : COUNT_UNIT_CHOICE;
}

/** Quantité et unité à enregistrer : « Aucune unité » efface la quantité. */
export function toStoredQuantityAndUnit(
  quantity: number | null,
  unitChoice: string,
): { quantity: number | null; unit: string } {
  if (unitChoice === NO_UNIT_CHOICE) {
    return { quantity: null, unit: '' };
  }
  return { quantity, unit: unitChoice.trim() };
}

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

/** Étape proposée au départ d'une nouvelle recette, avec la légende qui explique quoi y mettre. */
export type StarterRecipeStep = {
  title: string;
  legend: string;
};

/**
 * Les quatre étapes proposées pour chaque nouvelle recette : la courbe d'énergie d'une recette,
 * du calme de la préparation au plaisir de servir. Modifiables, supprimables, déplaçables.
 */
export const STARTER_RECIPE_STEPS: readonly StarterRecipeStep[] = [
  {
    title: 'Le calme avant la tempête',
    legend: 'On prépare, tranquille et concentré : laver, éplucher, couper, peser.',
  },
  {
    title: 'Le coup de feu',
    legend: 'Tout s’accélère, on est sur le feu : saisir, faire revenir, mélanger.',
  },
  {
    title: 'Lâcher prise',
    legend: 'La cuisson travaille sans nous : mijoter, four, repos, frigo.',
  },
  {
    title: 'Le bouquet final',
    legend: 'La fierté de servir : assaisonner, dresser, servir.',
  },
];

/** Légende d'une étape tant qu'elle garde le nom proposé au départ ; `null` sinon. */
export function findStarterStepLegend(stepTitle: string): string | null {
  const normalizedTitle: string = stepTitle.trim().toLocaleLowerCase('fr');
  return (
    STARTER_RECIPE_STEPS.find(
      (starterStep: StarterRecipeStep) =>
        starterStep.title.toLocaleLowerCase('fr') === normalizedTitle,
    )?.legend ?? null
  );
}

export function createEmptyRecipeFormModel(): RecipeFormModel {
  return {
    title: '',
    baseServings: DEFAULT_BASE_SERVINGS,
    preparationMinutes: null,
    ingredientLines: [createEmptyIngredientLine()],
    steps: STARTER_RECIPE_STEPS.map((starterStep: StarterRecipeStep): RecipeFormStep => ({
      title: starterStep.title,
      contentHtml: '',
    })),
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
              unit: toUnitChoice(ingredientLine.quantity, ingredientLine.unit),
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

/**
 * Copie du tableau où l'élément `previousIndex` est déplacé en `currentIndex` (bornes respectées).
 * Sert à réordonner les ingrédients par glisser-déposer ou au clavier.
 */
export function moveArrayItem<T>(
  items: readonly T[],
  previousIndex: number,
  currentIndex: number,
): T[] {
  const movedItems: T[] = [...items];
  const lastIndex: number = items.length - 1;
  const fromIndex: number = Math.min(Math.max(previousIndex, 0), lastIndex);
  const toIndex: number = Math.min(Math.max(currentIndex, 0), lastIndex);
  if (items.length === 0 || fromIndex === toIndex) {
    return movedItems;
  }
  const [movedItem] = movedItems.splice(fromIndex, 1);
  movedItems.splice(toIndex, 0, movedItem);
  return movedItems;
}

/** Une étape est gardée si elle a un titre ou un texte. */
export function isFilledStep(formStep: RecipeFormStep): boolean {
  return formStep.title.trim().length > 0 || formStep.contentHtml.length > 0;
}

/** Comparaison de noms d'ingrédients sans tenir compte des majuscules ni des espaces autour. */
export function normalizeIngredientName(ingredientName: string): string {
  return ingredientName.trim().toLocaleLowerCase('fr');
}
