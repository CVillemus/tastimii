import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  ResourceRef,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatPreparationTime } from '../../../core/recipes/quantity';
import { RecipeSummary } from '../../../core/recipes/recipe.model';
import { RecipesApi } from '../../../core/recipes/recipes-api';
import {
  applyMenuServingsChange,
  buildRecipeMenuStatuses,
  planServingsDecrease,
  planServingsIncrease,
} from '../../../core/shopping-list/recipe-menu-status';
import {
  MenuEntry,
  MenuServingsChange,
  RecipeMenuStatus,
} from '../../../core/shopping-list/shopping-list.model';
import { ShoppingListApi } from '../../../core/shopping-list/shopping-list-api';
import { collectUsedTags, filterBySelectedTags, RecipeTag } from '../../../core/tags/tag.model';
import { RecipePhoto } from '../recipe-photo/recipe-photo';

/** Accueil : toutes nos recettes, avec une recherche par titre et un filtre par tags. */
@Component({
  selector: 'app-recipe-list-page',
  imports: [RouterLink, RecipePhoto],
  templateUrl: './recipe-list-page.html',
  styleUrl: './recipe-list-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeListPage {
  private readonly recipesApi: RecipesApi = inject(RecipesApi);
  private readonly shoppingListApi: ShoppingListApi = inject(ShoppingListApi);

  protected readonly recipeSummariesResource: ResourceRef<RecipeSummary[] | undefined> = resource({
    loader: (): Promise<RecipeSummary[]> => this.recipesApi.fetchRecipeSummaries(),
  });

  protected readonly recipeSearchText: WritableSignal<string> = signal('');

  protected readonly matchingRecipeSummaries: Signal<RecipeSummary[]> = computed(() => {
    const allRecipeSummaries: RecipeSummary[] = this.recipeSummariesResource.hasValue()
      ? this.recipeSummariesResource.value()
      : [];
    const normalizedSearchText: string = normalizeForSearch(this.recipeSearchText());
    const recipesMatchingSearch: RecipeSummary[] = allRecipeSummaries.filter(
      (recipeSummary: RecipeSummary) =>
        normalizeForSearch(recipeSummary.title).includes(normalizedSearchText),
    );
    return filterBySelectedTags(recipesMatchingSearch, this.selectedTagIds());
  });

  /** Tags proposés comme filtres : seulement ceux qui sont sur au moins une recette. */
  protected readonly filterTags: Signal<RecipeTag[]> = computed(() =>
    this.recipeSummariesResource.hasValue()
      ? collectUsedTags(this.recipeSummariesResource.value())
      : [],
  );

  private readonly selectedTagIdsState: WritableSignal<ReadonlySet<string>> = signal(new Set());
  protected readonly selectedTagIds: Signal<ReadonlySet<string>> =
    this.selectedTagIdsState.asReadonly();

  protected readonly hasActiveFilters: Signal<boolean> = computed(
    () => this.selectedTagIds().size > 0 || this.recipeSearchText().trim().length > 0,
  );

  /** Nombre de cartes grises affichées pendant le chargement. */
  protected readonly skeletonCards: readonly number[] = [1, 2, 3, 4, 5, 6];

  protected readonly formatPreparationTime: (preparationMinutes: number) => string =
    formatPreparationTime;

  // ---- Menu des courses, depuis les vignettes ----

  protected readonly menuEntriesResource: ResourceRef<MenuEntry[] | undefined> = resource({
    loader: (): Promise<MenuEntry[]> => this.shoppingListApi.fetchMenuEntries(),
  });

  /** Recettes au menu, par identifiant de recette (total des parts, dernière entrée). */
  protected readonly recipeMenuStatuses: Signal<Map<string, RecipeMenuStatus>> = computed(() =>
    buildRecipeMenuStatuses(
      this.menuEntriesResource.hasValue() ? this.menuEntriesResource.value() : [],
    ),
  );

  /** Recettes en cours d'ajout (le bouton « + » attend la réponse de la base). */
  private readonly recipeIdsBeingAddedState: WritableSignal<ReadonlySet<string>> = signal(
    new Set(),
  );
  protected readonly recipeIdsBeingAdded: Signal<ReadonlySet<string>> =
    this.recipeIdsBeingAddedState.asReadonly();

  /** Les changements de parts partent dans l'ordre des clics, même si on clique vite. */
  private menuSaveQueue: Promise<void> = Promise.resolve();

  protected async addRecipeToShoppingList(recipeSummary: RecipeSummary): Promise<void> {
    this.recipeIdsBeingAddedState.update(
      (recipeIds: ReadonlySet<string>) => new Set([...recipeIds, recipeSummary.id]),
    );
    try {
      const createdMenuEntry: MenuEntry = await this.shoppingListApi.addRecipeToShoppingList(
        recipeSummary.id,
        recipeSummary.baseServings,
      );
      this.menuEntriesResource.update((menuEntries: MenuEntry[] | undefined) => [
        ...(menuEntries ?? []),
        createdMenuEntry,
      ]);
    } catch {
      this.menuEntriesResource.reload();
    } finally {
      this.recipeIdsBeingAddedState.update((recipeIds: ReadonlySet<string>) => {
        const remainingRecipeIds: Set<string> = new Set(recipeIds);
        remainingRecipeIds.delete(recipeSummary.id);
        return remainingRecipeIds;
      });
    }
  }

  protected increaseMenuServings(recipeMenuStatus: RecipeMenuStatus): void {
    this.applyMenuServingsChangeNow(planServingsIncrease(recipeMenuStatus));
  }

  protected decreaseMenuServings(recipeMenuStatus: RecipeMenuStatus): void {
    this.applyMenuServingsChangeNow(planServingsDecrease(recipeMenuStatus));
  }

  /** L'écran change tout de suite ; la base suit derrière. En cas d'échec, on relit le menu. */
  private applyMenuServingsChangeNow(menuServingsChange: MenuServingsChange): void {
    this.menuEntriesResource.update((menuEntries: MenuEntry[] | undefined) =>
      applyMenuServingsChange(menuEntries ?? [], menuServingsChange),
    );
    this.menuSaveQueue = this.menuSaveQueue.then(async () => {
      try {
        if (menuServingsChange.kind === 'removeFromMenu') {
          await this.shoppingListApi.removeRecipeFromShoppingList(menuServingsChange.menuEntryId);
        } else {
          await this.shoppingListApi.changeMenuRecipeServings(
            menuServingsChange.menuEntryId,
            menuServingsChange.wantedServings,
          );
        }
      } catch {
        this.menuEntriesResource.reload();
      }
    });
  }

  protected updateRecipeSearchText(inputEvent: Event): void {
    this.recipeSearchText.set((inputEvent.target as HTMLInputElement).value);
  }

  protected toggleTagFilter(tagId: string): void {
    this.selectedTagIdsState.update((selectedTagIds: ReadonlySet<string>) => {
      const nextSelectedTagIds: Set<string> = new Set(selectedTagIds);
      if (nextSelectedTagIds.has(tagId)) {
        nextSelectedTagIds.delete(tagId);
      } else {
        nextSelectedTagIds.add(tagId);
      }
      return nextSelectedTagIds;
    });
  }

  protected clearTagFilters(): void {
    this.selectedTagIdsState.set(new Set());
  }

  protected clearAllFilters(): void {
    this.clearTagFilters();
    this.recipeSearchText.set('');
  }
}

/** « Crème brûlée » et « creme brulee » doivent se trouver pareil. */
function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
