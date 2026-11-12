import { Ingredient, IngredientType, IngredientTypeGroup } from './ingredient.model';

/** Types triés par nom, chacun avec ses ingrédients triés par nom. */
export function groupIngredientsByType(
  ingredientTypes: readonly IngredientType[],
  ingredients: readonly Ingredient[],
): IngredientTypeGroup[] {
  return [...ingredientTypes]
    .sort(compareByFrenchName)
    .map((ingredientType: IngredientType): IngredientTypeGroup => ({
      ingredientType,
      ingredients: ingredients
        .filter((ingredient: Ingredient) => ingredient.typeId === ingredientType.id)
        .sort(compareByFrenchName),
    }));
}

/** Types triés par nom, pour les listes déroulantes. */
export function sortIngredientTypesByName(
  ingredientTypes: readonly IngredientType[],
): IngredientType[] {
  return [...ingredientTypes].sort(compareByFrenchName);
}

/** Libellé d'un type avec son emoji : « 🥩 Viandes », ou « Viandes » sans emoji. */
export function formatIngredientTypeLabel(ingredientType: IngredientType): string {
  const typeEmoji: string = ingredientType.emoji.trim();
  return typeEmoji.length > 0 ? `${typeEmoji} ${ingredientType.name}` : ingredientType.name;
}

export function compareByFrenchName(first: { name: string }, second: { name: string }): number {
  return first.name.localeCompare(second.name, 'fr');
}
