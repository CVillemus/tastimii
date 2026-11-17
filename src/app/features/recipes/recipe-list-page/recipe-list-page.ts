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
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KitchenApi } from '../../../core/kitchen/kitchen-api';
import { KitchenStore } from '../../../core/kitchen/kitchen-store';
import { formatPreparationTime, totalRecipeMinutes } from '../../../core/recipes/quantity';
import { RecipeSummary } from '../../../core/recipes/recipe.model';
import { RecipesApi } from '../../../core/recipes/recipes-api';
import {
  chooseRecipeSort,
  parseRecipeSort,
  RecipeSort,
  RecipeSortField,
  serializeRecipeSort,
  sortRecipes,
} from '../../../core/recipes/recipe-sorting';
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
import { ModalDialog } from '../../../shared/modal-dialog/modal-dialog';
import { RecipePhoto } from '../recipe-photo/recipe-photo';

/** Accueil : toutes nos recettes, avec une recherche par titre et un filtre par tags. */
@Component({
  selector: 'app-recipe-list-page',
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    ModalDialog,
    NgTemplateOutlet,
    RouterLink,
    RecipePhoto,
  ],
  templateUrl: './recipe-list-page.html',
  // Styles de la page et de la vue liste, des filtres, puis ceux de la vue mosaïque (cartes).
  styleUrls: ['./recipe-list-page.css', './recipe-list-filters.css', './recipe-list-mosaic.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeListPage {
  private readonly recipesApi: RecipesApi = inject(RecipesApi);
  private readonly documentRef: Document = inject(DOCUMENT);
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
      this.recipeSort(),
    );
  });

  /** Tri de la liste (critère et sens), retenu sur cet appareil. */
  private readonly recipeSortState: WritableSignal<RecipeSort> = signal(readRecipeSort());
  protected readonly recipeSort: Signal<RecipeSort> = this.recipeSortState.asReadonly();

  /** Vue de la liste : mosaïque de cartes ou lignes ; retenue sur cet appareil. */
  private readonly recipeListViewState: WritableSignal<RecipeListView> =
    signal(readRecipeListView());
  protected readonly recipeListView: Signal<RecipeListView> = this.recipeListViewState.asReadonly();

  protected changeRecipeListView(recipeListView: RecipeListView): void {
    this.recipeListViewState.set(recipeListView);
    saveRecipeListView(recipeListView);
  }

  /** Critères proposés, comme les en-têtes d'un tableau. */
  protected readonly recipeSortOptions: readonly { field: RecipeSortField; label: string }[] = [
    { field: 'title', label: 'Nom' },
    { field: 'createdAt', label: "Date d'ajout" },
  ];

  /** Clic sur un critère : le choisit, ou inverse le sens s'il est déjà actif. */
  protected chooseSortField(field: RecipeSortField): void {
    const nextSort: RecipeSort = chooseRecipeSort(this.recipeSort(), field);
    this.recipeSortState.set(nextSort);
    saveRecipeSort(nextSort);
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

  private readonly kitchenApi: KitchenApi = inject(KitchenApi);
  private readonly kitchenStore: KitchenStore = inject(KitchenStore);

  /** Message bref après une action du menu (« Lien copié », « En cuisine »), effacé tout seul. */
  private readonly toastMessageState: WritableSignal<string | null> = signal(null);
  protected readonly toastMessage: Signal<string | null> = this.toastMessageState.asReadonly();
  private toastTimeoutId: ReturnType<typeof setTimeout> | undefined;

  protected readonly formatPreparationTime: (preparationMinutes: number) => string =
    formatPreparationTime;
  protected readonly totalRecipeMinutes: (
    preparationMinutes: number | null,
    cookingMinutes: number | null,
  ) => number | null = totalRecipeMinutes;

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
      this.showToast(`Lien de « ${recipeSummary.title} » copié.`);
    } else if (outcome === 'failed') {
      this.showToast("Le lien n'a pas pu être copié.");
    }
  }

  /**
   * Menu « ⋯ » : met la recette directement en cuisine (courses faites hors de l'app, envie
   * improvisée), pour son nombre de parts de base.
   */
  protected async addRecipeToKitchen(recipeSummary: RecipeSummary): Promise<void> {
    try {
      await this.kitchenApi.addRecipeToKitchen(recipeSummary.id, recipeSummary.baseServings);
      await this.kitchenStore.refreshKitchenRecipeCount();
      this.showToast(
        `« ${recipeSummary.title} » est en cuisine (${recipeSummary.baseServings} parts).`,
      );
    } catch {
      this.showToast("La recette n'a pas pu être mise en cuisine.");
    }
  }

  private showToast(message: string): void {
    clearTimeout(this.toastTimeoutId);
    this.toastMessageState.set(message);
    this.toastTimeoutId = setTimeout(() => this.toastMessageState.set(null), 3000);
  }
}

/** Mosaïque de cartes (photo d'abord) ou lignes (vignette à gauche). */
type RecipeListView = 'mosaic' | 'rows';

const RECIPE_LIST_VIEW_STORAGE_KEY: string = 'tastimii.recipe-list-view';

/** Vue retenue, sinon la mosaïque. Sur téléphone, la liste s'affiche toujours en lignes (CSS). */
function readRecipeListView(): RecipeListView {
  try {
    const storedView: string | null = localStorage.getItem(RECIPE_LIST_VIEW_STORAGE_KEY);
    if (storedView === 'mosaic' || storedView === 'rows') {
      return storedView;
    }
  } catch {
    // Stockage indisponible : on garde la vue par défaut.
  }
  return 'mosaic';
}

function saveRecipeListView(recipeListView: RecipeListView): void {
  try {
    localStorage.setItem(RECIPE_LIST_VIEW_STORAGE_KEY, recipeListView);
  } catch {
    // Sans stockage, la vue revient à celle par défaut au prochain chargement.
  }
}

const RECIPE_SORT_STORAGE_KEY: string = 'tastimii.recipe-sort';

/** Lecture protégée : le stockage peut être indisponible (navigation privée…). */
function readRecipeSort(): RecipeSort {
  try {
    return parseRecipeSort(localStorage.getItem(RECIPE_SORT_STORAGE_KEY));
  } catch {
    return parseRecipeSort(null);
  }
}

function saveRecipeSort(recipeSort: RecipeSort): void {
  try {
    localStorage.setItem(RECIPE_SORT_STORAGE_KEY, serializeRecipeSort(recipeSort));
  } catch {
    // Sans stockage, le tri revient simplement par nom au prochain chargement.
  }
}

/** « Crème brûlée » et « creme brulee » doivent se trouver pareil. */
function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
