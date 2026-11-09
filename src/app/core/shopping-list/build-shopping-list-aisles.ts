import { compareByFrenchName, findAisleFamily } from '../ingredients/ingredient-family-tree';
import { Ingredient, IngredientCatalog, IngredientFamily } from '../ingredients/ingredient.model';
import { scaleQuantity } from '../recipes/quantity';
import { ShoppingListAisle, ShoppingListLine, ShoppingListMenuRecipe } from './shopping-list.model';

/** Ligne en cours de calcul : on garde son rayon pour le regroupement final. */
type ShoppingListLineWithAisle = ShoppingListLine & { aisleFamily: IngredientFamily | undefined };

const UNKNOWN_AISLE_ID: string = 'rayon-inconnu';
const UNKNOWN_AISLE_NAME: string = 'Autres';

/** Clé d'une ligne de courses : le même ingrédient dans la même unité ne fait qu'une ligne. */
export function buildShoppingListLineKey(ingredientId: string, unit: string): string {
  return `${ingredientId}|${normalizeUnit(unit)}`;
}

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase();
}

/**
 * Calcule la liste de courses :
 * 1. chaque quantité est ramenée au nombre de parts voulu,
 * 2. les mêmes ingrédients dans la même unité sont additionnés,
 * 3. les lignes sont rangées par rayon (la famille tout en haut de l'arbre),
 *    les lignes cochées à la fin de leur rayon.
 */
export function buildShoppingListAisles(
  menuRecipes: readonly ShoppingListMenuRecipe[],
  ingredientCatalog: IngredientCatalog,
  checkedLineKeys: ReadonlySet<string>,
): ShoppingListAisle[] {
  const familiesById: Map<string, IngredientFamily> = new Map(
    ingredientCatalog.families.map((family: IngredientFamily) => [family.id, family]),
  );
  const ingredientsById: Map<string, Ingredient> = new Map(
    ingredientCatalog.ingredients.map((ingredient: Ingredient) => [ingredient.id, ingredient]),
  );
  const linesByKey: Map<string, ShoppingListLineWithAisle> = new Map();

  for (const menuRecipe of menuRecipes) {
    for (const ingredientLine of menuRecipe.ingredientLines) {
      const ingredient: Ingredient | undefined = ingredientsById.get(ingredientLine.ingredientId);
      const lineKey: string = buildShoppingListLineKey(
        ingredientLine.ingredientId,
        ingredientLine.unit,
      );
      const scaledQuantity: number | null = scaleQuantity(
        ingredientLine.quantity,
        menuRecipe.baseServings,
        menuRecipe.wantedServings,
      );
      const existingLine: ShoppingListLineWithAisle | undefined = linesByKey.get(lineKey);

      if (existingLine === undefined) {
        linesByKey.set(lineKey, {
          lineKey,
          ingredientName: ingredient?.name ?? '?',
          quantity: scaledQuantity,
          unit: ingredientLine.unit.trim(),
          isChecked: checkedLineKeys.has(lineKey),
          aisleFamily:
            ingredient === undefined
              ? undefined
              : findAisleFamily(ingredient.familyId, familiesById),
        });
      } else {
        existingLine.quantity = addQuantities(existingLine.quantity, scaledQuantity);
      }
    }
  }

  const aislesById: Map<string, ShoppingListAisle> = new Map();
  for (const { aisleFamily, ...shoppingListLine } of linesByKey.values()) {
    const aisleFamilyId: string = aisleFamily?.id ?? UNKNOWN_AISLE_ID;
    const aisle: ShoppingListAisle = aislesById.get(aisleFamilyId) ?? {
      aisleFamilyId,
      aisleName: aisleFamily?.name ?? UNKNOWN_AISLE_NAME,
      lines: [],
    };
    aisle.lines.push(shoppingListLine);
    aislesById.set(aisleFamilyId, aisle);
  }

  return [...aislesById.values()]
    .sort((firstAisle: ShoppingListAisle, secondAisle: ShoppingListAisle) =>
      firstAisle.aisleName.localeCompare(secondAisle.aisleName, 'fr'),
    )
    .map((aisle: ShoppingListAisle) => ({
      ...aisle,
      lines: aisle.lines.sort(compareUncheckedFirstThenByName),
    }));
}

/** Une quantité « au goût » (vide) ne s'additionne pas : on garde l'autre. */
function addQuantities(firstQuantity: number | null, secondQuantity: number | null): number | null {
  if (firstQuantity === null) {
    return secondQuantity;
  }
  if (secondQuantity === null) {
    return firstQuantity;
  }
  return firstQuantity + secondQuantity;
}

function compareUncheckedFirstThenByName(
  firstLine: ShoppingListLine,
  secondLine: ShoppingListLine,
): number {
  if (firstLine.isChecked !== secondLine.isChecked) {
    return firstLine.isChecked ? 1 : -1;
  }
  return compareByFrenchName(
    { name: firstLine.ingredientName },
    { name: secondLine.ingredientName },
  );
}
