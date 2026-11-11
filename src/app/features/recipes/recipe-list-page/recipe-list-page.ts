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

  protected readonly formatPreparationTime: (preparationMinutes: number) => string =
    formatPreparationTime;

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
