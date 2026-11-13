import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  InputSignal,
  linkedSignal,
  resource,
  ResourceRef,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { keepScreenAwake } from '../../../core/device/keep-screen-awake';
import {
  formatPreparationTime,
  formatQuantityWithUnit,
  scaleQuantity,
} from '../../../core/recipes/quantity';
import {
  parseRecipeOrigin,
  Recipe,
  RecipeIngredientLine,
  RecipeOrigin,
} from '../../../core/recipes/recipe.model';
import { RecipePhotosApi } from '../../../core/recipes/recipe-photos-api';
import { RecipesApi } from '../../../core/recipes/recipes-api';
import { ShoppingListApi } from '../../../core/shopping-list/shopping-list-api';
import { LinkifyRichTextPipe } from '../../../shared/rich-text/linkify-rich-text.pipe';
import { RecipePhoto } from '../recipe-photo/recipe-photo';

/** Ingrédient affiché avec sa quantité recalculée pour le nombre de parts choisi. */
type ScaledIngredientLine = {
  ingredientName: string;
  formattedQuantity: string;
};

const MINIMUM_SERVINGS: number = 1;

/** Une recette : astuces en tête, ingrédients (recalculés selon les parts), étapes. */
@Component({
  selector: 'app-recipe-detail-page',
  imports: [LinkifyRichTextPipe, RouterLink, RecipePhoto],
  templateUrl: './recipe-detail-page.html',
  styleUrl: './recipe-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetailPage {
  private readonly recipesApi: RecipesApi = inject(RecipesApi);
  private readonly shoppingListApi: ShoppingListApi = inject(ShoppingListApi);
  private readonly recipePhotosApi: RecipePhotosApi = inject(RecipePhotosApi);
  private readonly router: Router = inject(Router);

  constructor() {
    // On suit souvent la recette en cuisinant : l'écran ne se met pas en veille sur la fiche.
    keepScreenAwake();
  }

  /** Vient de l'URL `/recettes/:recipeId`. */
  readonly recipeId: InputSignal<string> = input.required<string>();

  protected readonly recipeResource: ResourceRef<Recipe | undefined> = resource({
    params: (): { recipeId: string } => ({ recipeId: this.recipeId() }),
    loader: ({ params }): Promise<Recipe> => this.recipesApi.fetchRecipe(params.recipeId),
  });

  /** Lignes grises affichées pendant le chargement. */
  protected readonly skeletonIngredientLines: readonly number[] = [1, 2, 3, 4, 5];
  protected readonly skeletonSteps: readonly number[] = [1, 2, 3];

  /** Parts choisies : celles de la recette au départ, modifiables avec − et +. */
  protected readonly wantedServings: WritableSignal<number> = linkedSignal(() =>
    this.recipeResource.hasValue() ? this.recipeResource.value().baseServings : MINIMUM_SERVINGS,
  );

  protected readonly scaledIngredientLines: Signal<ScaledIngredientLine[]> = computed(() => {
    if (!this.recipeResource.hasValue()) {
      return [];
    }
    const recipe: Recipe = this.recipeResource.value();
    return recipe.ingredientLines.map(
      (ingredientLine: RecipeIngredientLine): ScaledIngredientLine => ({
        ingredientName: ingredientLine.ingredientName,
        formattedQuantity: formatQuantityWithUnit(
          scaleQuantity(ingredientLine.quantity, recipe.baseServings, this.wantedServings()),
          ingredientLine.unit,
        ),
      }),
    );
  });

  private readonly lastAddedServingsState: WritableSignal<number | null> = signal(null);
  protected readonly lastAddedServings: Signal<number | null> =
    this.lastAddedServingsState.asReadonly();
  private readonly isAddingToShoppingListState: WritableSignal<boolean> = signal(false);
  protected readonly isAddingToShoppingList: Signal<boolean> =
    this.isAddingToShoppingListState.asReadonly();

  protected readonly formatPreparationTime: (preparationMinutes: number) => string =
    formatPreparationTime;
  protected readonly parseRecipeOrigin: (origin: string) => RecipeOrigin | null = parseRecipeOrigin;

  protected decreaseWantedServings(): void {
    this.wantedServings.update((servings: number) => Math.max(MINIMUM_SERVINGS, servings - 1));
  }

  protected increaseWantedServings(): void {
    this.wantedServings.update((servings: number) => servings + 1);
  }

  protected async addRecipeToShoppingList(): Promise<void> {
    this.isAddingToShoppingListState.set(true);
    try {
      await this.shoppingListApi.addRecipeToShoppingList(this.recipeId(), this.wantedServings());
      this.lastAddedServingsState.set(this.wantedServings());
    } finally {
      this.isAddingToShoppingListState.set(false);
    }
  }

  protected async deleteRecipe(recipe: Recipe): Promise<void> {
    if (!confirm(`Supprimer la recette « ${recipe.title} » ? C'est définitif.`)) {
      return;
    }
    await this.recipesApi.deleteRecipe(recipe.id);
    // La photo n'est pas supprimée avec la recette : on retire aussi le fichier du stockage.
    if (recipe.photoPath !== null) {
      await this.recipePhotosApi.deleteRecipePhoto(recipe.photoPath);
    }
    await this.router.navigate(['/recettes']);
  }
}
