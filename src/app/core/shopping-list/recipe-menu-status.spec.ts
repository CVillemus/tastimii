import { describe, expect, it } from 'vitest';
import {
  applyMenuServingsChange,
  buildRecipeMenuStatuses,
  planServingsDecrease,
  planServingsIncrease,
} from './recipe-menu-status';
import { MenuEntry, RecipeMenuStatus } from './shopping-list.model';

const lentilsForTwo: MenuEntry = {
  menuEntryId: 'menu-1',
  recipeId: 'lentilles',
  wantedServings: 2,
};
const lentilsForFour: MenuEntry = {
  menuEntryId: 'menu-2',
  recipeId: 'lentilles',
  wantedServings: 4,
};
const cakeForOne: MenuEntry = { menuEntryId: 'menu-3', recipeId: 'gateau', wantedServings: 1 };

describe('recettes au menu vues depuis la liste des recettes', () => {
  it('additionne les parts d’une recette ajoutée plusieurs fois', () => {
    const recipeMenuStatuses: Map<string, RecipeMenuStatus> = buildRecipeMenuStatuses([
      lentilsForTwo,
      cakeForOne,
      lentilsForFour,
    ]);
    expect(recipeMenuStatuses.get('lentilles')).toEqual({
      recipeId: 'lentilles',
      totalServings: 6,
      lastMenuEntry: lentilsForFour,
    });
    expect(recipeMenuStatuses.get('gateau')?.totalServings).toBe(1);
    expect(recipeMenuStatuses.has('soupe')).toBe(false);
  });

  it('« + » ajoute une part à la dernière entrée', () => {
    const lentilsStatus: RecipeMenuStatus = buildRecipeMenuStatuses([lentilsForTwo]).get(
      'lentilles',
    ) as RecipeMenuStatus;
    expect(planServingsIncrease(lentilsStatus)).toEqual({
      kind: 'changeServings',
      menuEntryId: 'menu-1',
      wantedServings: 3,
    });
  });

  it('« − » enlève une part, et retire la recette du menu à 1 part', () => {
    const lentilsStatus: RecipeMenuStatus = buildRecipeMenuStatuses([lentilsForTwo]).get(
      'lentilles',
    ) as RecipeMenuStatus;
    expect(planServingsDecrease(lentilsStatus)).toEqual({
      kind: 'changeServings',
      menuEntryId: 'menu-1',
      wantedServings: 1,
    });
    const cakeStatus: RecipeMenuStatus = buildRecipeMenuStatuses([cakeForOne]).get(
      'gateau',
    ) as RecipeMenuStatus;
    expect(planServingsDecrease(cakeStatus)).toEqual({
      kind: 'removeFromMenu',
      menuEntryId: 'menu-3',
    });
  });

  it('met le menu à jour sur place après un changement', () => {
    const menuEntries: MenuEntry[] = [lentilsForTwo, cakeForOne];
    expect(
      applyMenuServingsChange(menuEntries, {
        kind: 'changeServings',
        menuEntryId: 'menu-1',
        wantedServings: 3,
      }),
    ).toEqual([{ ...lentilsForTwo, wantedServings: 3 }, cakeForOne]);
    expect(
      applyMenuServingsChange(menuEntries, { kind: 'removeFromMenu', menuEntryId: 'menu-3' }),
    ).toEqual([lentilsForTwo]);
  });
});
