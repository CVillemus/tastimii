import {
  ChangeDetectionStrategy,
  Component,
  inject,
  resource,
  ResourceRef,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { KitchenApi } from '../../../core/kitchen/kitchen-api';
import { KitchenRecipe } from '../../../core/kitchen/kitchen.model';
import { KitchenStore } from '../../../core/kitchen/kitchen-store';
import { formatPreparationTime } from '../../../core/recipes/quantity';
import { RecipePhoto } from '../../recipes/recipe-photo/recipe-photo';

const shoppingDateFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
});

/**
 * Cuisine : les recettes dont les courses sont faites. Une fois cuisinée, on la valide (elle est
 * comptée dans l'historique) ; si on a fait autre chose des aliments, on la retire.
 * La page n'est accessible que s'il y a des recettes en cuisine (voir kitchenNotEmptyGuard).
 */
@Component({
  selector: 'app-kitchen-page',
  imports: [RouterLink, RecipePhoto],
  templateUrl: './kitchen-page.html',
  styleUrl: './kitchen-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenPage {
  private readonly kitchenApi: KitchenApi = inject(KitchenApi);
  private readonly kitchenStore: KitchenStore = inject(KitchenStore);

  /** Recettes grises affichées pendant le chargement. */
  protected readonly skeletonRecipes: readonly number[] = [1, 2, 3];

  protected readonly kitchenRecipesResource: ResourceRef<KitchenRecipe[] | undefined> = resource({
    loader: (): Promise<KitchenRecipe[]> => this.kitchenApi.fetchKitchenRecipes(),
  });

  /** Recettes en cours d'enregistrement (cuisinée ou retirée), pour griser leurs boutons. */
  private readonly busyKitchenEntryIdsState: WritableSignal<ReadonlySet<string>> = signal(
    new Set<string>(),
  );
  protected readonly busyKitchenEntryIds: Signal<ReadonlySet<string>> =
    this.busyKitchenEntryIdsState.asReadonly();

  private readonly lastCookedRecipeTitleState: WritableSignal<string | null> = signal(null);
  protected readonly lastCookedRecipeTitle: Signal<string | null> =
    this.lastCookedRecipeTitleState.asReadonly();

  private readonly actionErrorMessageState: WritableSignal<string | null> = signal(null);
  protected readonly actionErrorMessage: Signal<string | null> =
    this.actionErrorMessageState.asReadonly();

  protected readonly formatPreparationTime: (preparationMinutes: number) => string =
    formatPreparationTime;

  protected formatShoppingDate(addedAt: string): string {
    return shoppingDateFormat.format(new Date(addedAt));
  }

  protected async markRecipeCooked(kitchenRecipe: KitchenRecipe): Promise<void> {
    await this.runKitchenAction(kitchenRecipe, () =>
      this.kitchenApi.markKitchenRecipeCooked(kitchenRecipe.kitchenEntryId),
    );
    if (this.actionErrorMessage() === null) {
      this.lastCookedRecipeTitleState.set(kitchenRecipe.recipe.title);
    }
  }

  protected async removeRecipeFromKitchen(kitchenRecipe: KitchenRecipe): Promise<void> {
    if (
      !confirm(
        `Retirer « ${kitchenRecipe.recipe.title} » de la cuisine ? Elle ne sera pas comptée comme cuisinée.`,
      )
    ) {
      return;
    }
    this.lastCookedRecipeTitleState.set(null);
    await this.runKitchenAction(kitchenRecipe, () =>
      this.kitchenApi.removeKitchenRecipe(kitchenRecipe.kitchenEntryId),
    );
  }

  /**
   * Enregistre l'action et retire la recette de l'écran. Quand la cuisine se vide, on reste sur
   * la page pour voir le message final ; l'onglet disparaît et la page ne sera plus accessible.
   */
  private async runKitchenAction(
    kitchenRecipe: KitchenRecipe,
    saveKitchenAction: () => Promise<void>,
  ): Promise<void> {
    const kitchenEntryId: string = kitchenRecipe.kitchenEntryId;
    this.actionErrorMessageState.set(null);
    this.setKitchenEntryBusy(kitchenEntryId, true);
    try {
      await saveKitchenAction();
      this.kitchenRecipesResource.update((kitchenRecipes: KitchenRecipe[] | undefined) =>
        (kitchenRecipes ?? []).filter(
          (remainingRecipe: KitchenRecipe) => remainingRecipe.kitchenEntryId !== kitchenEntryId,
        ),
      );
      const remainingRecipeCount: number = this.kitchenRecipesResource.hasValue()
        ? this.kitchenRecipesResource.value().length
        : 0;
      this.kitchenStore.setKitchenRecipeCount(remainingRecipeCount);
    } catch {
      this.actionErrorMessageState.set("L'action n'a pas pu être enregistrée. Réessayez.");
    } finally {
      this.setKitchenEntryBusy(kitchenEntryId, false);
    }
  }

  private setKitchenEntryBusy(kitchenEntryId: string, isBusy: boolean): void {
    this.busyKitchenEntryIdsState.update((busyKitchenEntryIds: ReadonlySet<string>) => {
      const nextBusyKitchenEntryIds: Set<string> = new Set(busyKitchenEntryIds);
      if (isBusy) {
        nextBusyKitchenEntryIds.add(kitchenEntryId);
      } else {
        nextBusyKitchenEntryIds.delete(kitchenEntryId);
      }
      return nextBusyKitchenEntryIds;
    });
  }
}
