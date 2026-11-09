import { describe, expect, it } from 'vitest';
import { IngredientCatalog } from '../ingredients/ingredient.model';
import { buildShoppingListAisles, buildShoppingListLineKey } from './build-shopping-list-aisles';
import { ShoppingListAisle, ShoppingListMenuRecipe } from './shopping-list.model';

const ingredientCatalog: IngredientCatalog = {
  families: [
    { id: 'viande', name: 'Viande', parentFamilyId: null },
    { id: 'poulet', name: 'Poulet', parentFamilyId: 'viande' },
    { id: 'legumes', name: 'Fruits et légumes', parentFamilyId: null },
  ],
  ingredients: [
    { id: 'cuisses', name: 'Cuisses de poulet', familyId: 'poulet', defaultUnit: '' },
    { id: 'citron', name: 'Citron', familyId: 'legumes', defaultUnit: '' },
    { id: 'ail', name: 'Ail', familyId: 'legumes', defaultUnit: 'gousse' },
  ],
};

const roastChicken: ShoppingListMenuRecipe = {
  menuEntryId: 'menu-1',
  recipeId: 'poulet-roti',
  recipeTitle: 'Poulet rôti',
  baseServings: 4,
  wantedServings: 2,
  ingredientLines: [
    { ingredientId: 'cuisses', quantity: 4, unit: '' },
    { ingredientId: 'citron', quantity: 2, unit: '' },
  ],
};

const lemonPie: ShoppingListMenuRecipe = {
  menuEntryId: 'menu-2',
  recipeId: 'tarte-citron',
  recipeTitle: 'Tarte au citron',
  baseServings: 6,
  wantedServings: 6,
  ingredientLines: [
    { ingredientId: 'citron', quantity: 3, unit: '' },
    { ingredientId: 'ail', quantity: null, unit: 'gousse' },
  ],
};

describe('liste de courses', () => {
  it('ramène les quantités au nombre de parts voulu', () => {
    const aisles: ShoppingListAisle[] = buildShoppingListAisles(
      [roastChicken],
      ingredientCatalog,
      new Set(),
    );
    const meatAisle: ShoppingListAisle | undefined = aisles.find(
      (aisle: ShoppingListAisle) => aisle.aisleName === 'Viande',
    );
    expect(meatAisle?.lines[0]).toMatchObject({ ingredientName: 'Cuisses de poulet', quantity: 2 });
  });

  it('additionne le même ingrédient venant de deux recettes', () => {
    const aisles: ShoppingListAisle[] = buildShoppingListAisles(
      [roastChicken, lemonPie],
      ingredientCatalog,
      new Set(),
    );
    const vegetablesAisle: ShoppingListAisle = aisles[0];
    expect(vegetablesAisle.aisleName).toBe('Fruits et légumes');
    expect(vegetablesAisle.lines.map((line) => [line.ingredientName, line.quantity])).toEqual([
      ['Ail', null],
      ['Citron', 4],
    ]);
  });

  it('range les sous-familles dans leur rayon et met les lignes cochées à la fin', () => {
    const aisles: ShoppingListAisle[] = buildShoppingListAisles(
      [roastChicken, lemonPie],
      ingredientCatalog,
      new Set([buildShoppingListLineKey('ail', 'Gousse ')]),
    );
    expect(aisles.map((aisle: ShoppingListAisle) => aisle.aisleName)).toEqual([
      'Fruits et légumes',
      'Viande',
    ]);
    expect(aisles[0].lines.map((line) => [line.ingredientName, line.isChecked])).toEqual([
      ['Citron', false],
      ['Ail', true],
    ]);
  });
});
