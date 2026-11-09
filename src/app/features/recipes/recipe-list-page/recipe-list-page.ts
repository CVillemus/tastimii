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

/** Accueil : toutes nos recettes, avec une recherche par titre. */
@Component({
  selector: 'app-recipe-list-page',
  imports: [RouterLink],
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
    return allRecipeSummaries.filter((recipeSummary: RecipeSummary) =>
      normalizeForSearch(recipeSummary.title).includes(normalizedSearchText),
    );
  });

  protected readonly formatPreparationTime: (preparationMinutes: number) => string =
    formatPreparationTime;

  protected updateRecipeSearchText(inputEvent: Event): void {
    this.recipeSearchText.set((inputEvent.target as HTMLInputElement).value);
  }
}

/** « Crème brûlée » et « creme brulee » doivent se trouver pareil. */
function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
