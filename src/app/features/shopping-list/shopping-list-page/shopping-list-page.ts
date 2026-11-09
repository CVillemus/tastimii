import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  ResourceRef,
  Signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatQuantityWithUnit } from '../../../core/recipes/quantity';
import {
  ShoppingList,
  ShoppingListAisle,
  ShoppingListLine,
  ShoppingListMenuRecipe,
} from '../../../core/shopping-list/shopping-list.model';
import { ShoppingListApi } from '../../../core/shopping-list/shopping-list-api';

/** Avancement des courses : lignes cochées sur le total. */
type ShoppingProgress = {
  checkedLineCount: number;
  totalLineCount: number;
};

const MINIMUM_SERVINGS: number = 1;

/** Liste de courses : recettes au menu (avec leurs parts) et ingrédients rangés par rayon. */
@Component({
  selector: 'app-shopping-list-page',
  imports: [RouterLink],
  templateUrl: './shopping-list-page.html',
  styleUrl: './shopping-list-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingListPage {
  private readonly shoppingListApi: ShoppingListApi = inject(ShoppingListApi);

  protected readonly shoppingListResource: ResourceRef<ShoppingList | undefined> = resource({
    loader: (): Promise<ShoppingList> => this.shoppingListApi.fetchShoppingList(),
  });

  protected readonly shoppingProgress: Signal<ShoppingProgress> = computed(() => {
    const allLines: ShoppingListLine[] = this.shoppingListResource.hasValue()
      ? this.shoppingListResource.value().aisles.flatMap((aisle: ShoppingListAisle) => aisle.lines)
      : [];
    return {
      checkedLineCount: allLines.filter((line: ShoppingListLine) => line.isChecked).length,
      totalLineCount: allLines.length,
    };
  });

  protected readonly formatQuantityWithUnit: (quantity: number | null, unit: string) => string =
    formatQuantityWithUnit;

  /** La case change tout de suite à l'écran ; la base suit derrière. */
  protected async toggleShoppingListLine(toggledLine: ShoppingListLine): Promise<void> {
    const isNowChecked: boolean = !toggledLine.isChecked;
    this.setLineCheckedOnScreen(toggledLine.lineKey, isNowChecked);
    try {
      if (isNowChecked) {
        await this.shoppingListApi.checkShoppingListLine(toggledLine.lineKey);
      } else {
        await this.shoppingListApi.uncheckShoppingListLine(toggledLine.lineKey);
      }
    } catch {
      this.setLineCheckedOnScreen(toggledLine.lineKey, !isNowChecked);
    }
  }

  protected async decreaseMenuRecipeServings(menuRecipe: ShoppingListMenuRecipe): Promise<void> {
    if (menuRecipe.wantedServings <= MINIMUM_SERVINGS) {
      return;
    }
    await this.shoppingListApi.changeMenuRecipeServings(
      menuRecipe.menuEntryId,
      menuRecipe.wantedServings - 1,
    );
    this.shoppingListResource.reload();
  }

  protected async increaseMenuRecipeServings(menuRecipe: ShoppingListMenuRecipe): Promise<void> {
    await this.shoppingListApi.changeMenuRecipeServings(
      menuRecipe.menuEntryId,
      menuRecipe.wantedServings + 1,
    );
    this.shoppingListResource.reload();
  }

  protected async removeRecipeFromShoppingList(menuRecipe: ShoppingListMenuRecipe): Promise<void> {
    await this.shoppingListApi.removeRecipeFromShoppingList(menuRecipe.menuEntryId);
    this.shoppingListResource.reload();
  }

  protected async clearShoppingList(): Promise<void> {
    if (!confirm('Vider toute la liste de courses ?')) {
      return;
    }
    await this.shoppingListApi.clearShoppingList();
    this.shoppingListResource.reload();
  }

  protected refreshShoppingList(): void {
    this.shoppingListResource.reload();
  }

  private setLineCheckedOnScreen(lineKey: string, isChecked: boolean): void {
    this.shoppingListResource.update((shoppingList: ShoppingList | undefined) =>
      shoppingList === undefined
        ? shoppingList
        : {
            ...shoppingList,
            aisles: shoppingList.aisles.map((aisle: ShoppingListAisle) => ({
              ...aisle,
              lines: aisle.lines.map((line: ShoppingListLine) =>
                line.lineKey === lineKey ? { ...line, isChecked } : line,
              ),
            })),
          },
    );
  }
}
