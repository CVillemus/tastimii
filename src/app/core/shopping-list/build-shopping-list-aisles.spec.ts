import { describe, expect, it } from 'vitest';
import { IngredientCatalog } from '../ingredients/ingredient.model';
import {
  buildItemsToCheckAtHome,
  buildShoppingListAisles,
  buildShoppingListLineKey,
  buildToBuyKey,
} from './build-shopping-list-aisles';
import { AtHomeCheckItem, ShoppingListAisle, ShoppingListMenuRecipe } from './shopping-list.model';

const ingredientCatalog: IngredientCatalog = {
  types: [
    { id: 'viande', name: 'Viande', emoji: '🥩' },
    { id: 'legumes', name: 'Fruits et légumes', emoji: '🥕' },
  ],
  ingredients: [
    {
      id: 'cuisses',
      name: 'Cuisses de poulet',
      typeId: 'viande',
      defaultUnit: '',
      isUsuallyAtHome: false,
    },
    { id: 'citron', name: 'Citron', typeId: 'legumes', defaultUnit: '', isUsuallyAtHome: false },
    { id: 'ail', name: 'Ail', typeId: 'legumes', defaultUnit: 'gousse', isUsuallyAtHome: false },
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

  it('range chaque ingrédient dans le rayon de son type et met les lignes cochées à la fin', () => {
    const aisles: ShoppingListAisle[] = buildShoppingListAisles(
      [roastChicken, lemonPie],
      ingredientCatalog,
      new Set([buildShoppingListLineKey('ail', 'Gousse ')]),
    );
    expect(aisles.map((aisle: ShoppingListAisle) => [aisle.aisleEmoji, aisle.aisleName])).toEqual([
      ['🥕', 'Fruits et légumes'],
      ['🥩', 'Viande'],
    ]);
    expect(aisles[0].lines.map((line) => [line.ingredientName, line.isChecked])).toEqual([
      ['Citron', false],
      ['Ail', true],
    ]);
  });

  it("range dans « Autres » un ingrédient dont le type n'existe plus", () => {
    const aisles: ShoppingListAisle[] = buildShoppingListAisles(
      [roastChicken],
      {
        types: [{ id: 'legumes', name: 'Fruits et légumes', emoji: '🥕' }],
        ingredients: ingredientCatalog.ingredients,
      },
      new Set(),
    );
    expect(aisles.map((aisle: ShoppingListAisle) => aisle.aisleName)).toEqual([
      'Autres',
      'Fruits et légumes',
    ]);
  });
});

describe('ingrédients souvent à la maison', () => {
  const catalogWithButter: IngredientCatalog = {
    types: [...ingredientCatalog.types, { id: 'cremerie', name: 'Crèmerie', emoji: '' }],
    ingredients: [
      ...ingredientCatalog.ingredients,
      { id: 'beurre', name: 'Beurre', typeId: 'cremerie', defaultUnit: 'g', isUsuallyAtHome: true },
    ],
  };
  const cake: ShoppingListMenuRecipe = {
    menuEntryId: 'menu-3',
    recipeId: 'gateau',
    recipeTitle: 'Gâteau',
    baseServings: 8,
    wantedServings: 8,
    ingredientLines: [{ ingredientId: 'beurre', quantity: 250, unit: 'g' }],
  };
  const lentils: ShoppingListMenuRecipe = {
    menuEntryId: 'menu-4',
    recipeId: 'lentilles',
    recipeTitle: 'Lentilles saucisse',
    baseServings: 2,
    wantedServings: 4,
    ingredientLines: [
      { ingredientId: 'beurre', quantity: null, unit: '' },
      { ingredientId: 'citron', quantity: 1, unit: '' },
    ],
  };

  it("ne les met pas d'office dans la liste, mais dans « À vérifier » avec chaque recette", () => {
    const aisles: ShoppingListAisle[] = buildShoppingListAisles(
      [cake, lentils],
      catalogWithButter,
      new Set(),
    );
    expect(aisles.map((aisle: ShoppingListAisle) => aisle.aisleName)).toEqual([
      'Fruits et légumes',
    ]);

    const itemsToCheckAtHome: AtHomeCheckItem[] = buildItemsToCheckAtHome(
      [cake, lentils],
      catalogWithButter,
      new Set(),
    );
    expect(itemsToCheckAtHome).toEqual([
      {
        ingredientId: 'beurre',
        ingredientName: 'Beurre',
        toBuyKey: buildToBuyKey('beurre'),
        needs: [
          { recipeTitle: 'Gâteau', quantity: 250, unit: 'g' },
          { recipeTitle: 'Lentilles saucisse', quantity: null, unit: '' },
        ],
      },
    ]);
  });

  it('les déplace dans leur rayon une fois ajoutés', () => {
    const toBuyKeys: Set<string> = new Set([buildToBuyKey('beurre')]);
    const aisles: ShoppingListAisle[] = buildShoppingListAisles(
      [cake],
      catalogWithButter,
      toBuyKeys,
    );
    expect(aisles[0]).toMatchObject({
      aisleName: 'Crèmerie',
      lines: [
        {
          ingredientName: 'Beurre',
          quantity: 250,
          unit: 'g',
          addedFromAtHomeKey: buildToBuyKey('beurre'),
        },
      ],
    });
    expect(buildItemsToCheckAtHome([cake], catalogWithButter, toBuyKeys)).toEqual([]);
  });
});
