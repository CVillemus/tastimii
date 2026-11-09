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
import {
  formatPreparationTime,
  formatQuantityWithUnit,
  scaleQuantity,
} from '../../../core/recipes/quantity';
import { Recipe, RecipeComment, RecipeIngredientLine } from '../../../core/recipes/recipe.model';
import { RecipesApi } from '../../../core/recipes/recipes-api';
import { ShoppingListApi } from '../../../core/shopping-list/shopping-list-api';

/** Ingrédient affiché avec sa quantité recalculée pour le nombre de parts choisi. */
type ScaledIngredientLine = {
  ingredientName: string;
  formattedQuantity: string;
};

const MINIMUM_SERVINGS: number = 1;
const commentDateFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
});

/** Une recette : ingrédients (recalculés selon les parts), étapes, notes, commentaires. */
@Component({
  selector: 'app-recipe-detail-page',
  imports: [RouterLink],
  templateUrl: './recipe-detail-page.html',
  styleUrl: './recipe-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetailPage {
  private readonly recipesApi: RecipesApi = inject(RecipesApi);
  private readonly shoppingListApi: ShoppingListApi = inject(ShoppingListApi);
  private readonly router: Router = inject(Router);

  /** Vient de l'URL `/recettes/:recipeId`. */
  readonly recipeId: InputSignal<string> = input.required<string>();

  protected readonly recipeResource: ResourceRef<Recipe | undefined> = resource({
    params: (): { recipeId: string } => ({ recipeId: this.recipeId() }),
    loader: ({ params }): Promise<Recipe> => this.recipesApi.fetchRecipe(params.recipeId),
  });

  protected readonly recipeCommentsResource: ResourceRef<RecipeComment[] | undefined> = resource({
    params: (): { recipeId: string } => ({ recipeId: this.recipeId() }),
    loader: ({ params }): Promise<RecipeComment[]> =>
      this.recipesApi.fetchRecipeComments(params.recipeId),
  });

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

  protected readonly newCommentContent: WritableSignal<string> = signal('');
  private readonly isPostingCommentState: WritableSignal<boolean> = signal(false);
  protected readonly isPostingComment: Signal<boolean> = this.isPostingCommentState.asReadonly();

  protected readonly formatPreparationTime: (preparationMinutes: number) => string =
    formatPreparationTime;

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

  protected updateNewCommentContent(inputEvent: Event): void {
    this.newCommentContent.set((inputEvent.target as HTMLTextAreaElement).value);
  }

  protected async postRecipeComment(submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    const commentContent: string = this.newCommentContent().trim();
    if (commentContent.length === 0) {
      return;
    }
    this.isPostingCommentState.set(true);
    try {
      await this.recipesApi.postRecipeComment(this.recipeId(), commentContent);
      this.newCommentContent.set('');
      this.recipeCommentsResource.reload();
    } finally {
      this.isPostingCommentState.set(false);
    }
  }

  protected async deleteRecipeComment(recipeComment: RecipeComment): Promise<void> {
    if (!confirm('Supprimer ce commentaire ?')) {
      return;
    }
    await this.recipesApi.deleteRecipeComment(recipeComment.id);
    this.recipeCommentsResource.reload();
  }

  protected async deleteRecipe(recipe: Recipe): Promise<void> {
    if (!confirm(`Supprimer la recette « ${recipe.title} » ? C'est définitif.`)) {
      return;
    }
    await this.recipesApi.deleteRecipe(recipe.id);
    await this.router.navigate(['/recettes']);
  }

  protected formatCommentDate(createdAt: string): string {
    return commentDateFormat.format(new Date(createdAt));
  }
}
