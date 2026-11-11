import { describe, expect, it } from 'vitest';
import { groupIngredientsByType, sortIngredientTypesByName } from './ingredient-types';
import { Ingredient, IngredientType, IngredientTypeGroup } from './ingredient.model';

const meatType: IngredientType = { id: 'viande', name: 'Viande' };
const dairyType: IngredientType = { id: 'cremerie', name: 'Crèmerie' };
const spicesType: IngredientType = { id: 'epices', name: 'Épices' };

const chickenThighs: Ingredient = {
  id: 'cuisses',
  name: 'Cuisses de poulet',
  typeId: 'viande',
  defaultUnit: '',
};
const ham: Ingredient = { id: 'jambon', name: 'Jambon', typeId: 'viande', defaultUnit: 'g' };
const butter: Ingredient = { id: 'beurre', name: 'Beurre', typeId: 'cremerie', defaultUnit: 'g' };

describe("types d'ingrédients", () => {
  it('range chaque ingrédient directement dans son type, triés par nom', () => {
    const ingredientTypeGroups: IngredientTypeGroup[] = groupIngredientsByType(
      [meatType, spicesType, dairyType],
      [ham, butter, chickenThighs],
    );

    expect(
      ingredientTypeGroups.map((ingredientTypeGroup: IngredientTypeGroup) => [
        ingredientTypeGroup.ingredientType.name,
        ingredientTypeGroup.ingredients.map((ingredient: Ingredient) => ingredient.name),
      ]),
    ).toEqual([
      ['Crèmerie', ['Beurre']],
      ['Épices', []],
      ['Viande', ['Cuisses de poulet', 'Jambon']],
    ]);
  });

  it('trie les types en tenant compte des accents', () => {
    expect(
      sortIngredientTypesByName([meatType, spicesType, dairyType]).map(
        (ingredientType: IngredientType) => ingredientType.name,
      ),
    ).toEqual(['Crèmerie', 'Épices', 'Viande']);
  });
});
