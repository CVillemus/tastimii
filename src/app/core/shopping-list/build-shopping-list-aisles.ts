import { compareByFrenchName } from '../ingredients/ingredient-types';
import { Ingredient, IngredientCatalog, IngredientType } from '../ingredients/ingredient.model';
import { scaleQuantity } from '../recipes/quantity';
import {
  AtHomeCheckItem,
  ShoppingListAisle,
  ShoppingListLine,
  ShoppingListMenuRecipe,
} from './shopping-list.model';

/** Ligne en cours de calcul : on garde son type (son rayon) pour le regroupement final. */
type ShoppingListLineWithAisle = ShoppingListLine & {
  ingredientType: IngredientType | undefined;
};

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
 * Clé enregistrée quand un ingrédient « souvent à la maison » est coché « à acheter ».
 * Elle vit dans la même table que les lignes cochées, sans risque de collision (préfixe).
 */
export function buildToBuyKey(ingredientId: string): string {
  return `a-acheter|${ingredientId}`;
}

/** Vrai si l'ingrédient va dans la liste : pas « souvent à la maison », ou coché « à acheter ». */
function isOnShoppingList(
  ingredient: Ingredient | undefined,
  checkedLineKeys: ReadonlySet<string>,
): boolean {
  return (
    ingredient === undefined ||
    !ingredient.isUsuallyAtHome ||
    checkedLineKeys.has(buildToBuyKey(ingredient.id))
  );
}

/**
 * Ingrédients « souvent à la maison » demandés par le menu, à vérifier avant de partir :
 * pour chacun, ce que chaque recette demande (quantité ramenée aux parts voulues). Triés par nom.
 */
export function buildItemsToCheckAtHome(
  menuRecipes: readonly ShoppingListMenuRecipe[],
  ingredientCatalog: IngredientCatalog,
  checkedLineKeys: ReadonlySet<string>,
): AtHomeCheckItem[] {
  const ingredientsById: Map<string, Ingredient> = new Map(
    ingredientCatalog.ingredients.map((ingredient: Ingredient) => [ingredient.id, ingredient]),
  );
  const itemsByIngredientId: Map<string, AtHomeCheckItem> = new Map();

  for (const menuRecipe of menuRecipes) {
    for (const ingredientLine of menuRecipe.ingredientLines) {
      const ingredient: Ingredient | undefined = ingredientsById.get(ingredientLine.ingredientId);
      if (ingredient === undefined || !ingredient.isUsuallyAtHome) {
        continue;
      }
      const toBuyKey: string = buildToBuyKey(ingredient.id);
      const item: AtHomeCheckItem = itemsByIngredientId.get(ingredient.id) ?? {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        toBuyKey,
        isToBuy: checkedLineKeys.has(toBuyKey),
        needs: [],
      };
      item.needs.push({
        recipeTitle: menuRecipe.recipeTitle,
        quantity: scaleQuantity(
          ingredientLine.quantity,
          menuRecipe.baseServings,
          menuRecipe.wantedServings,
        ),
        unit: ingredientLine.unit.trim(),
      });
      itemsByIngredientId.set(ingredient.id, item);
    }
  }

  return [...itemsByIngredientId.values()].sort(
    (firstItem: AtHomeCheckItem, secondItem: AtHomeCheckItem) =>
      compareByFrenchName({ name: firstItem.ingredientName }, { name: secondItem.ingredientName }),
  );
}

/**
 * Calcule la liste de courses :
 * 1. les ingrédients « souvent à la maison » n'y vont que s'ils sont cochés « à acheter »,
 * 2. chaque quantité est ramenée au nombre de parts voulu,
 * 3. les mêmes ingrédients dans la même unité sont additionnés,
 * 4. les lignes sont rangées par rayon (le type de l'ingrédient),
 *    les lignes cochées à la fin de leur rayon.
 */
export function buildShoppingListAisles(
  menuRecipes: readonly ShoppingListMenuRecipe[],
  ingredientCatalog: IngredientCatalog,
  checkedLineKeys: ReadonlySet<string>,
): ShoppingListAisle[] {
  const ingredientTypesById: Map<string, IngredientType> = new Map(
    ingredientCatalog.types.map((ingredientType: IngredientType) => [
      ingredientType.id,
      ingredientType,
    ]),
  );
  const ingredientsById: Map<string, Ingredient> = new Map(
    ingredientCatalog.ingredients.map((ingredient: Ingredient) => [ingredient.id, ingredient]),
  );
  const linesByKey: Map<string, ShoppingListLineWithAisle> = new Map();

  for (const menuRecipe of menuRecipes) {
    for (const ingredientLine of menuRecipe.ingredientLines) {
      const ingredient: Ingredient | undefined = ingredientsById.get(ingredientLine.ingredientId);
      if (!isOnShoppingList(ingredient, checkedLineKeys)) {
        continue;
      }
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
          ingredientType:
            ingredient === undefined ? undefined : ingredientTypesById.get(ingredient.typeId),
        });
      } else {
        existingLine.quantity = addQuantities(existingLine.quantity, scaledQuantity);
      }
    }
  }

  const aislesById: Map<string, ShoppingListAisle> = new Map();
  for (const { ingredientType, ...shoppingListLine } of linesByKey.values()) {
    const ingredientTypeId: string = ingredientType?.id ?? UNKNOWN_AISLE_ID;
    const aisle: ShoppingListAisle = aislesById.get(ingredientTypeId) ?? {
      ingredientTypeId,
      aisleName: ingredientType?.name ?? UNKNOWN_AISLE_NAME,
      lines: [],
    };
    aisle.lines.push(shoppingListLine);
    aislesById.set(ingredientTypeId, aisle);
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
