import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
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
import { RecipeSortOrder, sortRecipes } from '../../../core/recipes/recipe-sorting';
import { buildRecipeShareUrl, shareLink, ShareLinkOutcome } from '../../../core/sharing/share-link';
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
import {
  collectUsedTags,
  filterByTagSelection,
  groupTagsByCategory,
  RecipeTag,
  TagCategoryGroup,
  toggleRecipeTag,
} from '../../../core/tags/tag.model';
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
    const selectedTags: RecipeTag[] = this.filterTags().filter((filterTag: RecipeTag) =>
      this.selectedTagIds().has(filterTag.id),
    );
    return sortRecipes(
      filterByTagSelection(recipesMatchingSearch, selectedTags),
      this.recipeSortOrder(),
    );
  });

  /** Ordre de la liste, retenu sur cet appareil. */
  private readonly recipeSortOrderState: WritableSignal<RecipeSortOrder> =
    signal(readRecipeSortOrder());
  protected readonly recipeSortOrder: Signal<RecipeSortOrder> =
    this.recipeSortOrderState.asReadonly();

  protected changeRecipeSortOrder(sortOrder: RecipeSortOrder): void {
    this.recipeSortOrderState.set(sortOrder);
    saveRecipeSortOrder(sortOrder);
  }

  /** Tags proposés comme filtres : seulement ceux qui sont sur au moins une recette. */
  protected readonly filterTags: Signal<RecipeTag[]> = computed(() =>
    this.recipeSummariesResource.hasValue()
      ? collectUsedTags(this.recipeSummariesResource.value())
      : [],
  );

  /** Les filtres rangés par catégorie : type de plat, saison, envie. */
  protected readonly filterTagGroups: Signal<TagCategoryGroup[]> = computed(() =>
    groupTagsByCategory(this.filterTags()),
  );

  private readonly selectedTagIdsState: WritableSignal<ReadonlySet<string>> = signal(new Set());
  protected readonly selectedTagIds: Signal<ReadonlySet<string>> =
    this.selectedTagIdsState.asReadonly();

  protected readonly hasActiveFilters: Signal<boolean> = computed(
    () => this.selectedTagIds().size > 0 || this.recipeSearchText().trim().length > 0,
  );

  /** Nombre de cartes grises affichées pendant le chargement. */
  protected readonly skeletonCards: readonly number[] = [1, 2, 3, 4, 5, 6];

  private readonly documentRef: Document = inject(DOCUMENT);

  /** Message après un partage (« Lien copié »), effacé au bout de quelques secondes. */
  private readonly shareMessageState: WritableSignal<string | null> = signal(null);
  protected readonly shareMessage: Signal<string | null> = this.shareMessageState.asReadonly();
  private shareMessageTimeoutId: ReturnType<typeof setTimeout> | undefined;

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

  /** Coche ou décoche un filtre ; pour la saison, choisir Hiver retire Été. */
  protected toggleTagFilter(toggledTag: RecipeTag): void {
    this.selectedTagIdsState.update(
      (selectedTagIds: ReadonlySet<string>) =>
        new Set(toggleRecipeTag([...selectedTagIds], toggledTag, this.filterTags())),
    );
  }

  protected clearTagFilters(): void {
    this.selectedTagIdsState.set(new Set());
  }

  protected clearAllFilters(): void {
    this.clearTagFilters();
    this.recipeSearchText.set('');
  }

  /** Partage discret depuis la liste : feuille de partage sur téléphone, sinon copie du lien. */
  protected async shareRecipe(recipeSummary: RecipeSummary): Promise<void> {
    const browserWindow: Window | null = this.documentRef.defaultView;
    if (browserWindow === null) {
      return;
    }
    const outcome: ShareLinkOutcome = await shareLink(
      {
        title: recipeSummary.title,
        url: buildRecipeShareUrl(recipeSummary.id, this.documentRef.baseURI),
      },
      browserWindow,
    );
    if (outcome === 'copied') {
      this.showShareMessage(`Lien de « ${recipeSummary.title} » copié.`);
    } else if (outcome === 'failed') {
      this.showShareMessage("Le lien n'a pas pu être copié.");
    }
  }

  private showShareMessage(message: string): void {
    clearTimeout(this.shareMessageTimeoutId);
    this.shareMessageState.set(message);
    this.shareMessageTimeoutId = setTimeout(() => this.shareMessageState.set(null), 3000);
  }
}

const RECIPE_SORT_ORDER_STORAGE_KEY: string = 'tastimii.recipe-sort-order';

/** Lecture protégée : le stockage peut être indisponible (navigation privée…). */
function readRecipeSortOrder(): RecipeSortOrder {
  try {
    return localStorage.getItem(RECIPE_SORT_ORDER_STORAGE_KEY) === 'newest'
      ? 'newest'
      : 'alphabetical';
  } catch {
    return 'alphabetical';
  }
}

function saveRecipeSortOrder(sortOrder: RecipeSortOrder): void {
  try {
    localStorage.setItem(RECIPE_SORT_ORDER_STORAGE_KEY, sortOrder);
  } catch {
    // Sans stockage, l'ordre revient simplement à A → Z au prochain chargement.
  }
}

/** « Crème brûlée » et « creme brulee » doivent se trouver pareil. */
function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
