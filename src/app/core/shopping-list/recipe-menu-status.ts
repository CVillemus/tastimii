import { MenuEntry, MenuServingsChange, RecipeMenuStatus } from './shopping-list.model';

/**
 * Pour chaque recette au menu : le total de ses parts et sa dernière entrée.
 * Une recette ajoutée deux fois (2 parts puis 4 parts) affiche 6 parts.
 */
export function buildRecipeMenuStatuses(
  menuEntries: readonly MenuEntry[],
): Map<string, RecipeMenuStatus> {
  const recipeMenuStatuses: Map<string, RecipeMenuStatus> = new Map();
  for (const menuEntry of menuEntries) {
    const existingStatus: RecipeMenuStatus | undefined = recipeMenuStatuses.get(menuEntry.recipeId);
    recipeMenuStatuses.set(menuEntry.recipeId, {
      recipeId: menuEntry.recipeId,
      totalServings: (existingStatus?.totalServings ?? 0) + menuEntry.wantedServings,
      lastMenuEntry: menuEntry,
    });
  }
  return recipeMenuStatuses;
}

/** « + » : une part de plus sur la dernière entrée. */
export function planServingsIncrease(recipeMenuStatus: RecipeMenuStatus): MenuServingsChange {
  return {
    kind: 'changeServings',
    menuEntryId: recipeMenuStatus.lastMenuEntry.menuEntryId,
    wantedServings: recipeMenuStatus.lastMenuEntry.wantedServings + 1,
  };
}

/** « − » : une part de moins ; à 1 part, la dernière entrée sort du menu. */
export function planServingsDecrease(recipeMenuStatus: RecipeMenuStatus): MenuServingsChange {
  const { lastMenuEntry }: RecipeMenuStatus = recipeMenuStatus;
  if (lastMenuEntry.wantedServings <= 1) {
    return { kind: 'removeFromMenu', menuEntryId: lastMenuEntry.menuEntryId };
  }
  return {
    kind: 'changeServings',
    menuEntryId: lastMenuEntry.menuEntryId,
    wantedServings: lastMenuEntry.wantedServings - 1,
  };
}

/** Le menu après un changement, pour mettre l'écran à jour sans attendre la base. */
export function applyMenuServingsChange(
  menuEntries: readonly MenuEntry[],
  menuServingsChange: MenuServingsChange,
): MenuEntry[] {
  if (menuServingsChange.kind === 'removeFromMenu') {
    return menuEntries.filter(
      (menuEntry: MenuEntry) => menuEntry.menuEntryId !== menuServingsChange.menuEntryId,
    );
  }
  return menuEntries.map((menuEntry: MenuEntry) =>
    menuEntry.menuEntryId === menuServingsChange.menuEntryId
      ? { ...menuEntry, wantedServings: menuServingsChange.wantedServings }
      : menuEntry,
  );
}
