import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
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
import { RouterLink } from '@angular/router';
import { keepScreenAwake } from '../../../core/device/keep-screen-awake';
import { buildRecipeShareUrl, shareLink, ShareLinkOutcome } from '../../../core/sharing/share-link';
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
import { KitchenApi } from '../../../core/kitchen/kitchen-api';
import { KitchenStore } from '../../../core/kitchen/kitchen-store';
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
  private readonly kitchenApi: KitchenApi = inject(KitchenApi);
  private readonly kitchenStore: KitchenStore = inject(KitchenStore);
  private readonly documentRef: Document = inject(DOCUMENT);

  /** Message après un partage (« Lien copié »), effacé au bout de quelques secondes. */
  private readonly shareMessageState: WritableSignal<string | null> = signal(null);
  protected readonly shareMessage: Signal<string | null> = this.shareMessageState.asReadonly();
  private shareMessageTimeoutId: ReturnType<typeof setTimeout> | undefined;

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

  /** Nombre de fois où la recette a été cuisinée (validée « Cuisinée » en cuisine). */
  protected readonly cookedCountResource: ResourceRef<number | undefined> = resource({
    params: (): { recipeId: string } => ({ recipeId: this.recipeId() }),
    loader: ({ params }): Promise<number> => this.recipesApi.countRecipeCookings(params.recipeId),
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
  /** Parts mises directement en cuisine (affiche « En cuisine pour N parts »). */
  private readonly lastAddedToKitchenServingsState: WritableSignal<number | null> = signal(null);
  protected readonly lastAddedToKitchenServings: Signal<number | null> =
    this.lastAddedToKitchenServingsState.asReadonly();
  private readonly isAddingToKitchenState: WritableSignal<boolean> = signal(false);
  protected readonly isAddingToKitchen: Signal<boolean> = this.isAddingToKitchenState.asReadonly();
  private readonly addToKitchenErrorMessageState: WritableSignal<string | null> = signal(null);
  protected readonly addToKitchenErrorMessage: Signal<string | null> =
    this.addToKitchenErrorMessageState.asReadonly();

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

  /** « Ajouter à la cuisine » : directement en cuisine, sans passer par les courses. */
  protected async addRecipeToKitchen(): Promise<void> {
    this.isAddingToKitchenState.set(true);
    this.addToKitchenErrorMessageState.set(null);
    try {
      await this.kitchenApi.addRecipeToKitchen(this.recipeId(), this.wantedServings());
      this.lastAddedToKitchenServingsState.set(this.wantedServings());
      await this.kitchenStore.refreshKitchenRecipeCount();
    } catch {
      this.addToKitchenErrorMessageState.set(
        "La recette n'a pas pu être mise en cuisine. Réessayez.",
      );
    } finally {
      this.isAddingToKitchenState.set(false);
    }
  }

  /** « Partager » : feuille de partage sur téléphone, sinon copie du lien de la recette. */
  protected async shareRecipe(recipe: Recipe): Promise<void> {
    const browserWindow: Window | null = this.documentRef.defaultView;
    if (browserWindow === null) {
      return;
    }
    const outcome: ShareLinkOutcome = await shareLink(
      { title: recipe.title, url: buildRecipeShareUrl(recipe.id, this.documentRef.baseURI) },
      browserWindow,
    );
    if (outcome === 'copied') {
      this.showShareMessage('Lien copié : collez-le où vous voulez.');
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
