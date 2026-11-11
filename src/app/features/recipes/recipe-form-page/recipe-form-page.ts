import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
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
  disabled,
  FieldTree,
  form,
  FormField,
  min,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { sortIngredientTypesByName } from '../../../core/ingredients/ingredient-types';
import {
  Ingredient,
  IngredientCatalog,
  IngredientType,
  SUGGESTED_UNITS,
} from '../../../core/ingredients/ingredient.model';
import { IngredientsApi } from '../../../core/ingredients/ingredients-api';
import {
  Recipe,
  RecipeDraft,
  RecipeDraftIngredientLine,
  RecipeStep,
} from '../../../core/recipes/recipe.model';
import { RecipePhotosApi } from '../../../core/recipes/recipe-photos-api';
import { RecipesApi } from '../../../core/recipes/recipes-api';
import { resizeRecipePhoto } from '../../../core/recipes/resize-recipe-photo';
import { compareTagsByName, normalizeTagName, RecipeTag } from '../../../core/tags/tag.model';
import { TagsApi } from '../../../core/tags/tags-api';
import { RichTextEditor } from '../../../shared/rich-text-editor/rich-text-editor';
import {
  buildUnitChoices,
  COUNT_UNIT_CHOICE,
  createEmptyIngredientLine,
  createEmptyRecipeFormModel,
  createEmptyStep,
  isFilledStep,
  NO_UNIT_CHOICE,
  normalizeIngredientName,
  RecipeFormIngredientLine,
  RecipeFormModel,
  RecipeFormStep,
  toRecipeFormModel,
  toStoredQuantityAndUnit,
  UnitChoice,
} from './recipe-form.model';

/**
 * Ce qu'on fera de la photo à l'enregistrement : rien, envoyer la nouvelle, ou retirer l'actuelle.
 * `previewUrl` est une adresse locale (`blob:`) pour l'aperçu avant l'envoi.
 */
type RecipePhotoChoice =
  | { kind: 'unchanged' }
  | { kind: 'new'; resizedPhoto: Blob; previewUrl: string }
  | { kind: 'removed' };

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
  private readonly recipePhotosApi: RecipePhotosApi = inject(RecipePhotosApi);
  private readonly tagsApi: TagsApi = inject(TagsApi);
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

  protected readonly tagsResource: ResourceRef<RecipeTag[] | undefined> = resource({
    loader: (): Promise<RecipeTag[]> => this.tagsApi.fetchTags(),
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

  protected readonly sortedIngredientTypes: Signal<IngredientType[]> = computed(() =>
    this.ingredientCatalogResource.hasValue()
      ? sortIngredientTypesByName(this.ingredientCatalogResource.value().types)
      : [],
  );

  protected readonly unitChoices: readonly UnitChoice[] = buildUnitChoices(SUGGESTED_UNITS);
  private readonly listedUnitChoiceValues: ReadonlySet<string> = new Set(
    this.unitChoices.map((unitChoice: UnitChoice) => unitChoice.value),
  );

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
        disabled(
          ingredientLinePath.quantity,
          ({ valueOf }) => valueOf(ingredientLinePath.unit) === NO_UNIT_CHOICE,
        );
        validate(ingredientLinePath.newIngredientTypeId, ({ value, valueOf }) =>
          this.isNewIngredientName(valueOf(ingredientLinePath.ingredientName)) && value() === ''
            ? {
                kind: 'typeManquant',
                message: 'Choisissez un type pour ce nouvel ingrédient.',
              }
            : undefined,
        );
      });
    },
  );

  private readonly photoChoiceState: WritableSignal<RecipePhotoChoice> = signal({
    kind: 'unchanged',
  });

  /** Photo affichée dans le formulaire : la nouvelle, l'actuelle, ou aucune. */
  protected readonly displayedPhotoUrl: Signal<string | null> = computed(() => {
    const photoChoice: RecipePhotoChoice = this.photoChoiceState();
    if (photoChoice.kind === 'new') {
      return photoChoice.previewUrl;
    }
    if (photoChoice.kind === 'removed' || !this.existingRecipeResource.hasValue()) {
      return null;
    }
    return this.existingRecipeResource.value().photoUrl;
  });

  private readonly isPreparingPhotoState: WritableSignal<boolean> = signal(false);
  protected readonly isPreparingPhoto: Signal<boolean> = this.isPreparingPhotoState.asReadonly();
  private readonly photoErrorMessageState: WritableSignal<string | null> = signal(null);
  protected readonly photoErrorMessage: Signal<string | null> =
    this.photoErrorMessageState.asReadonly();

  protected readonly newTagName: WritableSignal<string> = signal('');
  private readonly isCreatingTagState: WritableSignal<boolean> = signal(false);
  protected readonly isCreatingTag: Signal<boolean> = this.isCreatingTagState.asReadonly();
  private readonly tagErrorMessageState: WritableSignal<string | null> = signal(null);
  protected readonly tagErrorMessage: Signal<string | null> =
    this.tagErrorMessageState.asReadonly();

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

    inject(DestroyRef).onDestroy(() => this.revokePhotoPreview());
  }

  /** Réduit la photo choisie (appareil photo ou galerie) et l'affiche en aperçu. */
  protected async chooseRecipePhoto(changeEvent: Event): Promise<void> {
    const photoInput: HTMLInputElement = changeEvent.target as HTMLInputElement;
    const photoFile: File | undefined = photoInput.files?.[0];
    photoInput.value = '';
    if (photoFile === undefined) {
      return;
    }
    this.photoErrorMessageState.set(null);
    this.isPreparingPhotoState.set(true);
    try {
      const resizedPhoto: Blob = await resizeRecipePhoto(photoFile);
      this.revokePhotoPreview();
      this.photoChoiceState.set({
        kind: 'new',
        resizedPhoto,
        previewUrl: URL.createObjectURL(resizedPhoto),
      });
    } catch {
      this.photoErrorMessageState.set("Cette image n'a pas pu être lue. Essayez une autre photo.");
    } finally {
      this.isPreparingPhotoState.set(false);
    }
  }

  protected isTagSelected(tagId: string): boolean {
    return this.recipeFormModel().tagIds.includes(tagId);
  }

  protected toggleTag(tagId: string): void {
    this.recipeFormModel.update((formModel: RecipeFormModel) => ({
      ...formModel,
      tagIds: formModel.tagIds.includes(tagId)
        ? formModel.tagIds.filter((selectedTagId: string) => selectedTagId !== tagId)
        : [...formModel.tagIds, tagId],
    }));
  }

  protected updateNewTagName(inputEvent: Event): void {
    this.newTagName.set((inputEvent.target as HTMLInputElement).value);
  }

  /** Crée le tag tapé (ou reprend celui qui existe déjà sous ce nom) et le coche. */
  protected async addNewTag(): Promise<void> {
    const tagName: string = this.newTagName().trim();
    if (tagName.length === 0 || !this.tagsResource.hasValue()) {
      return;
    }
    const existingTag: RecipeTag | undefined = this.tagsResource
      .value()
      .find((tag: RecipeTag) => normalizeTagName(tag.name) === normalizeTagName(tagName));
    if (existingTag !== undefined) {
      if (!this.isTagSelected(existingTag.id)) {
        this.toggleTag(existingTag.id);
      }
      this.newTagName.set('');
      return;
    }
    this.isCreatingTagState.set(true);
    this.tagErrorMessageState.set(null);
    try {
      const createdTag: RecipeTag = await this.tagsApi.createTag(tagName);
      this.tagsResource.update((tags: RecipeTag[]) =>
        [...tags, createdTag].sort(compareTagsByName),
      );
      this.toggleTag(createdTag.id);
      this.newTagName.set('');
    } catch {
      this.tagErrorMessageState.set("Le tag n'a pas pu être créé.");
    } finally {
      this.isCreatingTagState.set(false);
    }
  }

  protected removeRecipePhoto(): void {
    this.revokePhotoPreview();
    this.photoChoiceState.set({ kind: 'removed' });
  }

  /** Vrai si un nom est tapé et ne correspond à aucun ingrédient connu. */
  protected isNewIngredientName(ingredientName: string): boolean {
    const normalizedName: string = normalizeIngredientName(ingredientName);
    return normalizedName.length > 0 && !this.ingredientsByNormalizedName().has(normalizedName);
  }

  /** En choisissant un ingrédient connu, on reprend son unité habituelle si « Nombre » est choisi. */
  protected fillDefaultUnit(ingredientLineField: FieldTree<RecipeFormIngredientLine>): void {
    const knownIngredient: Ingredient | undefined = this.ingredientsByNormalizedName().get(
      normalizeIngredientName(ingredientLineField.ingredientName().value()),
    );
    if (knownIngredient !== undefined && ingredientLineField.unit().value() === COUNT_UNIT_CHOICE) {
      ingredientLineField.unit().value.set(knownIngredient.defaultUnit);
    }
  }

  /** « Aucune unité » n'a pas de quantité : on vide le champ, qui est désactivé. */
  protected clearQuantityWithoutUnit(
    ingredientLineField: FieldTree<RecipeFormIngredientLine>,
  ): void {
    if (ingredientLineField.unit().value() === NO_UNIT_CHOICE) {
      ingredientLineField.quantity().value.set(null);
    }
  }

  /** Vrai pour une unité tapée autrefois à la main, absente de la liste : on la garde comme choix. */
  protected isUnlistedUnit(unitChoice: string): boolean {
    return !this.listedUnitChoiceValues.has(unitChoice);
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
        ...toStoredQuantityAndUnit(ingredientLine.quantity, ingredientLine.unit),
      });
    }

    const recipeDraft: RecipeDraft = {
      title: formModel.title,
      baseServings: formModel.baseServings,
      preparationMinutes: formModel.preparationMinutes,
      descriptionHtml: formModel.descriptionHtml,
      tagIds: formModel.tagIds,
      steps: formModel.steps.filter(isFilledStep).map((formStep: RecipeFormStep): RecipeStep => ({
        title: formStep.title,
        contentHtml: formStep.contentHtml,
      })),
      ingredientLines: draftIngredientLines,
    };

    const existingRecipeId: string | undefined = this.recipeId();
    let savedRecipeId: string;
    if (existingRecipeId === undefined) {
      savedRecipeId = await this.recipesApi.createRecipe(recipeDraft);
    } else {
      await this.recipesApi.updateRecipe(existingRecipeId, recipeDraft);
      savedRecipeId = existingRecipeId;
    }
    await this.saveRecipePhoto(savedRecipeId);
    return savedRecipeId;
  }

  /** Envoie la nouvelle photo ou retire l'actuelle, puis supprime l'ancien fichier. */
  private async saveRecipePhoto(recipeId: string): Promise<void> {
    const photoChoice: RecipePhotoChoice = this.photoChoiceState();
    if (photoChoice.kind === 'unchanged') {
      return;
    }
    const previousPhotoPath: string | null = this.existingRecipeResource.hasValue()
      ? this.existingRecipeResource.value().photoPath
      : null;
    const newPhotoPath: string | null =
      photoChoice.kind === 'new'
        ? await this.recipePhotosApi.uploadRecipePhoto(recipeId, photoChoice.resizedPhoto)
        : null;
    await this.recipePhotosApi.updateRecipePhotoPath(recipeId, newPhotoPath);
    if (previousPhotoPath !== null) {
      await this.recipePhotosApi.deleteRecipePhoto(previousPhotoPath);
    }
  }

  private revokePhotoPreview(): void {
    const photoChoice: RecipePhotoChoice = this.photoChoiceState();
    if (photoChoice.kind === 'new') {
      URL.revokeObjectURL(photoChoice.previewUrl);
    }
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
      ingredientLine.newIngredientTypeId,
      toStoredQuantityAndUnit(ingredientLine.quantity, ingredientLine.unit).unit,
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
