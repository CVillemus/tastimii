import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  InputSignal,
  resource,
  ResourceRef,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  applyEach,
  FieldTree,
  form,
  FormField,
  min,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { formatFamilyPath } from '../../../core/ingredients/ingredient-family-tree';
import {
  Ingredient,
  IngredientCatalog,
  IngredientFamily,
  SUGGESTED_UNITS,
} from '../../../core/ingredients/ingredient.model';
import { IngredientsApi } from '../../../core/ingredients/ingredients-api';
import { Recipe, RecipeDraft, RecipeDraftIngredientLine } from '../../../core/recipes/recipe.model';
import { RecipesApi } from '../../../core/recipes/recipes-api';
import { RichTextEditor } from '../../../shared/rich-text-editor/rich-text-editor';
import {
  createEmptyIngredientLine,
  createEmptyRecipeFormModel,
  createEmptyStep,
  normalizeIngredientName,
  RecipeFormIngredientLine,
  RecipeFormModel,
  RecipeFormStep,
  toRecipeFormModel,
} from './recipe-form.model';

/** Famille proposée dans la liste déroulante, avec son chemin complet. */
type FamilyOption = {
  familyId: string;
  label: string;
};

/** Création (`/recettes/nouvelle`) et modification (`/recettes/:recipeId/modifier`) d'une recette. */
@Component({
  selector: 'app-recipe-form-page',
  imports: [FormField, RouterLink, RichTextEditor],
  templateUrl: './recipe-form-page.html',
  styleUrl: './recipe-form-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeFormPage {
  private readonly recipesApi: RecipesApi = inject(RecipesApi);
  private readonly ingredientsApi: IngredientsApi = inject(IngredientsApi);
  private readonly router: Router = inject(Router);

  /** Présent seulement en modification (vient de l'URL). */
  readonly recipeId: InputSignal<string | undefined> = input<string | undefined>();

  protected readonly isEditingExistingRecipe: Signal<boolean> = computed(
    () => this.recipeId() !== undefined,
  );

  protected readonly ingredientCatalogResource: ResourceRef<IngredientCatalog | undefined> =
    resource({
      loader: (): Promise<IngredientCatalog> => this.ingredientsApi.fetchIngredientCatalog(),
    });

  /** En création, `params` vaut `undefined` : la resource ne charge rien. */
  private readonly existingRecipeResource: ResourceRef<Recipe | undefined> = resource({
    params: (): { recipeId: string } | undefined => {
      const recipeId: string | undefined = this.recipeId();
      return recipeId === undefined ? undefined : { recipeId };
    },
    loader: ({ params }): Promise<Recipe> => this.recipesApi.fetchRecipe(params.recipeId),
  });

  protected readonly isExistingRecipeLoading: Signal<boolean> = computed(
    () => this.isEditingExistingRecipe() && !this.existingRecipeResource.hasValue(),
  );

  private readonly ingredientsByNormalizedName: Signal<Map<string, Ingredient>> = computed(() => {
    const ingredients: Ingredient[] = this.ingredientCatalogResource.hasValue()
      ? this.ingredientCatalogResource.value().ingredients
      : [];
    return new Map(
      ingredients.map((ingredient: Ingredient) => [
        normalizeIngredientName(ingredient.name),
        ingredient,
      ]),
    );
  });

  protected readonly knownIngredients: Signal<Ingredient[]> = computed(() =>
    this.ingredientCatalogResource.hasValue()
      ? this.ingredientCatalogResource.value().ingredients
      : [],
  );

  protected readonly familyOptions: Signal<FamilyOption[]> = computed(() => {
    if (!this.ingredientCatalogResource.hasValue()) {
      return [];
    }
    const families: IngredientFamily[] = this.ingredientCatalogResource.value().families;
    const familiesById: Map<string, IngredientFamily> = new Map(
      families.map((family: IngredientFamily) => [family.id, family]),
    );
    return families
      .map((family: IngredientFamily): FamilyOption => ({
        familyId: family.id,
        label: formatFamilyPath(family.id, familiesById),
      }))
      .sort((firstOption: FamilyOption, secondOption: FamilyOption) =>
        firstOption.label.localeCompare(secondOption.label, 'fr'),
      );
  });

  protected readonly suggestedUnits: readonly string[] = SUGGESTED_UNITS;

  private readonly recipeFormModel: WritableSignal<RecipeFormModel> = signal(
    createEmptyRecipeFormModel(),
  );

  protected readonly recipeForm: FieldTree<RecipeFormModel> = form(
    this.recipeFormModel,
    (recipeFormPath) => {
      required(recipeFormPath.title, { message: 'Donnez un titre à la recette.' });
      required(recipeFormPath.baseServings, { message: 'Indiquez le nombre de parts.' });
      min(recipeFormPath.baseServings, 1, { message: 'Au moins une part.' });
      min(recipeFormPath.preparationMinutes, 1, { message: 'Au moins une minute.' });
      applyEach(recipeFormPath.ingredientLines, (ingredientLinePath) => {
        min(ingredientLinePath.quantity, 0.01, { message: 'La quantité doit être positive.' });
        validate(ingredientLinePath.newIngredientFamilyId, ({ value, valueOf }) =>
          this.isNewIngredientName(valueOf(ingredientLinePath.ingredientName)) && value() === ''
            ? {
                kind: 'familleManquante',
                message: 'Choisissez une famille pour ce nouvel ingrédient.',
              }
            : undefined,
        );
      });
    },
  );

  private readonly saveErrorMessageState: WritableSignal<string | null> = signal(null);
  protected readonly saveErrorMessage: Signal<string | null> =
    this.saveErrorMessageState.asReadonly();

  constructor() {
    // En modification : remplir le formulaire dès que la recette est chargée.
    effect(() => {
      if (this.existingRecipeResource.hasValue()) {
        this.recipeFormModel.set(toRecipeFormModel(this.existingRecipeResource.value()));
      }
    });
  }

  /** Vrai si un nom est tapé et ne correspond à aucun ingrédient connu. */
  protected isNewIngredientName(ingredientName: string): boolean {
    const normalizedName: string = normalizeIngredientName(ingredientName);
    return normalizedName.length > 0 && !this.ingredientsByNormalizedName().has(normalizedName);
  }

  /** En choisissant un ingrédient connu, on reprend son unité habituelle si l'unité est vide. */
  protected fillDefaultUnit(ingredientLineField: FieldTree<RecipeFormIngredientLine>): void {
    const knownIngredient: Ingredient | undefined = this.ingredientsByNormalizedName().get(
      normalizeIngredientName(ingredientLineField.ingredientName().value()),
    );
    if (knownIngredient !== undefined && ingredientLineField.unit().value() === '') {
      ingredientLineField.unit().value.set(knownIngredient.defaultUnit);
    }
  }

  protected addIngredientLine(): void {
    this.recipeFormModel.update((formModel: RecipeFormModel) => ({
      ...formModel,
      ingredientLines: [...formModel.ingredientLines, createEmptyIngredientLine()],
    }));
  }

  protected removeIngredientLine(removedIndex: number): void {
    this.recipeFormModel.update((formModel: RecipeFormModel) => ({
      ...formModel,
      ingredientLines: formModel.ingredientLines.filter(
        (_ingredientLine: RecipeFormIngredientLine, lineIndex: number) =>
          lineIndex !== removedIndex,
      ),
    }));
  }

  protected addStep(): void {
    this.recipeFormModel.update((formModel: RecipeFormModel) => ({
      ...formModel,
      steps: [...formModel.steps, createEmptyStep()],
    }));
  }

  protected removeStep(removedIndex: number): void {
    this.recipeFormModel.update((formModel: RecipeFormModel) => ({
      ...formModel,
      steps: formModel.steps.filter(
        (_step: RecipeFormStep, stepIndex: number) => stepIndex !== removedIndex,
      ),
    }));
  }

  protected async submitRecipeForm(submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    await submit(this.recipeForm, async () => {
      this.saveErrorMessageState.set(null);
      try {
        const savedRecipeId: string = await this.saveRecipe(this.recipeFormModel());
        await this.router.navigate(['/recettes', savedRecipeId]);
      } catch {
        this.saveErrorMessageState.set(
          "L'enregistrement a échoué. Vérifiez la connexion et réessayez.",
        );
      }
      return undefined;
    });
  }

  /** Crée d'abord les nouveaux ingrédients, puis enregistre la recette. Renvoie son identifiant. */
  private async saveRecipe(formModel: RecipeFormModel): Promise<string> {
    const filledIngredientLines: RecipeFormIngredientLine[] = formModel.ingredientLines.filter(
      (ingredientLine: RecipeFormIngredientLine) =>
        normalizeIngredientName(ingredientLine.ingredientName).length > 0,
    );
    const draftIngredientLines: RecipeDraftIngredientLine[] = [];
    for (const ingredientLine of filledIngredientLines) {
      const ingredientId: string = await this.findOrCreateIngredientId(ingredientLine);
      draftIngredientLines.push({
        ingredientId,
        quantity: ingredientLine.quantity,
        unit: ingredientLine.unit,
      });
    }

    const recipeDraft: RecipeDraft = {
      title: formModel.title,
      baseServings: formModel.baseServings,
      preparationMinutes: formModel.preparationMinutes,
      descriptionHtml: formModel.descriptionHtml,
      steps: formModel.steps
        .map((step: RecipeFormStep) => step.instruction.trim())
        .filter((instruction: string) => instruction.length > 0),
      ingredientLines: draftIngredientLines,
    };

    const existingRecipeId: string | undefined = this.recipeId();
    if (existingRecipeId === undefined) {
      return this.recipesApi.createRecipe(recipeDraft);
    }
    await this.recipesApi.updateRecipe(existingRecipeId, recipeDraft);
    return existingRecipeId;
  }

  private async findOrCreateIngredientId(
    ingredientLine: RecipeFormIngredientLine,
  ): Promise<string> {
    const knownIngredient: Ingredient | undefined = this.ingredientsByNormalizedName().get(
      normalizeIngredientName(ingredientLine.ingredientName),
    );
    if (knownIngredient !== undefined) {
      return knownIngredient.id;
    }
    const createdIngredient: Ingredient = await this.ingredientsApi.createIngredient(
      ingredientLine.ingredientName,
      ingredientLine.newIngredientFamilyId,
      ingredientLine.unit,
    );
    // Si le même nouvel ingrédient apparaît deux fois, la deuxième ligne le retrouvera.
    this.ingredientCatalogResource.update((ingredientCatalog: IngredientCatalog | undefined) =>
      ingredientCatalog === undefined
        ? ingredientCatalog
        : {
            ...ingredientCatalog,
            ingredients: [...ingredientCatalog.ingredients, createdIngredient],
          },
    );
    return createdIngredient.id;
  }
}
