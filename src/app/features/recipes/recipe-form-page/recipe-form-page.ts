import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  inject,
  Injector,
  input,
  InputSignal,
  resource,
  ResourceRef,
  Signal,
  signal,
  untracked,
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { sortIngredientTypesByName } from '../../../core/ingredients/ingredient-types';
import {
  Ingredient,
  IngredientCatalog,
  IngredientType,
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
import {
  compareTagsByName,
  groupTagsByCategory,
  normalizeTagName,
  RecipeTag,
  TAG_CATEGORIES,
  TagCategory,
  TagCategoryDefinition,
  TagCategoryGroup,
  toggleRecipeTag,
} from '../../../core/tags/tag.model';
import { TagsApi } from '../../../core/tags/tags-api';
import { ConfirmationDialog } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { ModalDialog } from '../../../shared/modal-dialog/modal-dialog';
import { TagManager } from '../../tags/tag-manager/tag-manager';
import {
  createEmptyRecipeFormModel,
  isFilledStep,
  isNewIngredientName,
  NO_UNIT_CHOICE,
  normalizeIngredientName,
  RecipeFormIngredientLine,
  RecipeFormModel,
  RecipeFormStep,
  toRecipeFormModel,
  toStoredQuantityAndUnit,
} from './recipe-form.model';
import {
  FIRST_RECIPE_FORM_STEP,
  hasNamedIngredientLine,
  hasStepWithText,
  isUntouchedRecipeFormModel,
  LAST_RECIPE_FORM_STEP,
  parseRecipeDraft,
  parseRecipeFormStep,
  RECIPE_DRAFT_STORAGE_KEY,
  RECIPE_FORM_STEPS,
  RecipeFormStepDefinition,
  RecipeFormStepNumber,
  serializeRecipeDraft,
} from './recipe-form-steps';
import { RecipeIngredientsStep } from './recipe-ingredients-step/recipe-ingredients-step';
import { RecipePreparationStep } from './recipe-preparation-step/recipe-preparation-step';

/**
 * Ce qu'on fera de la photo à l'enregistrement : rien, envoyer la nouvelle, ou retirer l'actuelle.
 * `previewUrl` est une adresse locale (`blob:`) pour l'aperçu avant l'envoi.
 */
type RecipePhotoChoice =
  | { kind: 'unchanged' }
  | { kind: 'new'; resizedPhoto: Blob; previewUrl: string }
  | { kind: 'removed' };

/**
 * Création (`/recettes/nouvelle`) et modification (`/recettes/:recipeId/modifier`) d'une recette,
 * en trois étapes : infos, ingrédients, préparation (`?etape=2` dans l'adresse).
 * - En création, on avance dans l'ordre : « Suivant » vérifie l'étape avant de passer à la
 *   suivante, et un brouillon est gardé sur l'appareil jusqu'à l'enregistrement.
 * - En modification, les étapes s'ouvrent librement et « Enregistrer » est sur chaque étape.
 */
@Component({
  selector: 'app-recipe-form-page',
  imports: [
    ConfirmationDialog,
    FormField,
    ModalDialog,
    RecipeIngredientsStep,
    RecipePreparationStep,
    RouterLink,
    TagManager,
  ],
  templateUrl: './recipe-form-page.html',
  styleUrl: './recipe-form-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeFormPage {
  /** Champs gris affichés pendant le chargement de la recette à modifier. */
  protected readonly skeletonFields: readonly number[] = [1, 2, 3, 4];

  private readonly recipesApi: RecipesApi = inject(RecipesApi);
  private readonly ingredientsApi: IngredientsApi = inject(IngredientsApi);
  private readonly recipePhotosApi: RecipePhotosApi = inject(RecipePhotosApi);
  private readonly tagsApi: TagsApi = inject(TagsApi);
  private readonly router: Router = inject(Router);
  private readonly activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly documentRef: Document = inject(DOCUMENT);
  private readonly injector: Injector = inject(Injector);

  /** Présent seulement en modification (vient de l'URL). */
  readonly recipeId: InputSignal<string | undefined> = input<string | undefined>();

  /** Étape demandée dans l'adresse (`?etape=2`) ; la première si absente. */
  readonly etape: InputSignal<string | undefined> = input<string | undefined>();

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
      min(recipeFormPath.cookingMinutes, 1, { message: 'Au moins une minute.' });
      // Au moins une des deux durées (le message s'affiche sous la préparation).
      validate(recipeFormPath.preparationMinutes, ({ value, valueOf }) =>
        isMissingDuration(value()) && isMissingDuration(valueOf(recipeFormPath.cookingMinutes))
          ? {
              kind: 'dureeManquante',
              message: 'Indiquez une durée de préparation ou de cuisson.',
            }
          : undefined,
      );
      applyEach(recipeFormPath.ingredientLines, (ingredientLinePath) => {
        min(ingredientLinePath.quantity, 0.01, { message: 'La quantité doit être positive.' });
        disabled(
          ingredientLinePath.quantity,
          ({ valueOf }) => valueOf(ingredientLinePath.unit) === NO_UNIT_CHOICE,
        );
        validate(ingredientLinePath.newIngredientTypeId, ({ value, valueOf }) =>
          isNewIngredientName(
            valueOf(ingredientLinePath.ingredientName),
            this.ingredientsByNormalizedName(),
          ) && value() === ''
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

  /** Les tags rangés par catégorie (type de plat, saison, envie), catégories vides comprises. */
  protected readonly tagCategoryGroups: Signal<TagCategoryGroup[]> = computed(() =>
    groupTagsByCategory(this.tagsResource.hasValue() ? this.tagsResource.value() : [], true),
  );
  protected readonly tagCategories: readonly TagCategoryDefinition[] = TAG_CATEGORIES;

  protected readonly newTagName: WritableSignal<string> = signal('');
  protected readonly newTagCategory: WritableSignal<TagCategory> = signal('type_de_plat');
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

    // Un tag supprimé dans « Gérer les tags » ne doit plus être coché sur la recette.
    effect(() => {
      if (!this.tagsResource.hasValue()) {
        return;
      }
      const existingTagIds: Set<string> = new Set(
        this.tagsResource.value().map((tag: RecipeTag) => tag.id),
      );
      const selectedTagIds: string[] = untracked(() => this.recipeFormModel().tagIds);
      if (selectedTagIds.some((tagId: string) => !existingTagIds.has(tagId))) {
        this.recipeFormModel.update((formModel: RecipeFormModel) => ({
          ...formModel,
          tagIds: formModel.tagIds.filter((tagId: string) => existingTagIds.has(tagId)),
        }));
      }
    });

    // Création : reprendre le brouillon laissé sur l'appareil, puis le tenir à jour à chaque saisie.
    afterNextRender(() => {
      if (!this.isEditingExistingRecipe()) {
        this.restoreDraft();
      }
    });
    effect(() => {
      const recipeFormModel: RecipeFormModel = this.recipeFormModel();
      if (this.isDraftSavingActive()) {
        this.saveDraft(recipeFormModel);
      }
    });

    inject(DestroyRef).onDestroy(() => this.revokePhotoPreview());
  }

  // ---- Étapes du formulaire ----

  protected readonly recipeFormSteps: readonly RecipeFormStepDefinition[] = RECIPE_FORM_STEPS;
  protected readonly firstStep: RecipeFormStepNumber = FIRST_RECIPE_FORM_STEP;
  protected readonly lastStep: RecipeFormStepNumber = LAST_RECIPE_FORM_STEP;

  /**
   * Étapes terminées :
   * 1. un titre, des parts et une durée valides ;
   * 2. au moins un ingrédient, et un type pour chaque nouvel ingrédient ;
   * 3. au moins une étape avec un texte.
   */
  protected readonly completedSteps: Signal<ReadonlySet<RecipeFormStepNumber>> = computed(() => {
    const recipeFormModel: RecipeFormModel = this.recipeFormModel();
    const completedSteps: Set<RecipeFormStepNumber> = new Set();
    if (this.areInfoFieldsValid()) {
      completedSteps.add(1);
    }
    if (
      hasNamedIngredientLine(recipeFormModel.ingredientLines) &&
      this.recipeForm.ingredientLines().valid()
    ) {
      completedSteps.add(2);
    }
    if (hasStepWithText(recipeFormModel.steps)) {
      completedSteps.add(3);
    }
    return completedSteps;
  });

  /** En création, on ne peut pas aller plus loin que la première étape pas terminée. */
  private readonly firstIncompleteStep: Signal<RecipeFormStepNumber> = computed(
    () =>
      this.recipeFormSteps
        .map((formStep: RecipeFormStepDefinition) => formStep.stepNumber)
        .find((stepNumber: RecipeFormStepNumber) => !this.completedSteps().has(stepNumber)) ??
      LAST_RECIPE_FORM_STEP,
  );

  /** Étape affichée : celle de l'adresse, sauf en création si une étape précédente manque. */
  protected readonly currentStep: Signal<RecipeFormStepNumber> = computed(() => {
    const requestedStep: RecipeFormStepNumber = parseRecipeFormStep(this.etape());
    if (this.isEditingExistingRecipe() || requestedStep <= this.firstIncompleteStep()) {
      return requestedStep;
    }
    return this.firstIncompleteStep();
  });

  /** Dernière étape où l'on a tenté d'avancer (ou d'enregistrer) : ses manques s'affichent. */
  private readonly attemptedStepState: WritableSignal<RecipeFormStepNumber | null> = signal(null);

  /** Ce qui manque pour terminer l'étape, après une tentative ; disparaît une fois corrigé. */
  protected readonly stepProblem: Signal<string | null> = computed(() => {
    const currentStep: RecipeFormStepNumber = this.currentStep();
    const isCurrentStepMissingSomething: boolean = this.isEditingExistingRecipe()
      ? this.hasInvalidFieldOnStep(currentStep)
      : !this.completedSteps().has(currentStep);
    if (this.attemptedStepState() !== currentStep || !isCurrentStepMissingSomething) {
      return null;
    }
    return this.describeStepProblem(currentStep);
  });

  protected canOpenStep(stepNumber: RecipeFormStepNumber): boolean {
    return this.isEditingExistingRecipe() || stepNumber <= this.firstIncompleteStep();
  }

  /** « Suivant » : montre ce qui manque, ou passe à l'étape suivante si tout est bon. */
  protected goToNextStep(): void {
    const currentStep: RecipeFormStepNumber = this.currentStep();
    this.attemptedStepState.set(currentStep);
    this.markStepFieldsAsTouched(currentStep);
    const canLeaveStep: boolean = this.isEditingExistingRecipe()
      ? !this.hasInvalidFieldOnStep(currentStep)
      : this.completedSteps().has(currentStep);
    if (!canLeaveStep) {
      this.focusFirstProblem(currentStep);
    } else if (currentStep < LAST_RECIPE_FORM_STEP) {
      this.goToStep((currentStep + 1) as RecipeFormStepNumber);
    }
  }

  /**
   * Après un « Suivant » ou un « Enregistrer » refusé : le curseur va sur le premier champ à
   * corriger (et l'écran défile jusqu'à lui), une fois les messages d'erreur affichés.
   * - un champ en erreur (titre, quantité, type d'un nouvel ingrédient…) : ce champ ;
   * - aucun ingrédient : le nom du premier ingrédient ;
   * - aucune étape écrite : le texte de la première étape.
   */
  private focusFirstProblem(stepNumber: RecipeFormStepNumber): void {
    afterNextRender(
      {
        read: () => {
          const formElement: HTMLFormElement | null =
            this.documentRef.querySelector<HTMLFormElement>('.recipe-form');
          const problemField: HTMLElement | null | undefined =
            this.findFieldWithError(formElement) ??
            this.findEmptyRequiredField(formElement, stepNumber);
          problemField?.focus();
          problemField?.scrollIntoView({ block: 'center' });
        },
      },
      { injector: this.injector },
    );
  }

  /** Premier champ suivi d'un message d'erreur, dans l'ordre de la page. */
  private findFieldWithError(formElement: HTMLFormElement | null): HTMLElement | null | undefined {
    const firstFieldError: Element | null | undefined = formElement?.querySelector(
      '.field-error:not(.form-step-nav__problem)',
    );
    return firstFieldError?.parentElement?.querySelector<HTMLElement>(
      'input:not([disabled]), select, textarea, [contenteditable="true"]',
    );
  }

  /** Champ à remplir quand l'étape est vide : pas de message sous un champ précis. */
  private findEmptyRequiredField(
    formElement: HTMLFormElement | null,
    stepNumber: RecipeFormStepNumber,
  ): HTMLElement | null | undefined {
    if (stepNumber === 2) {
      return formElement?.querySelector<HTMLElement>('[id^="ingredient-name-"]');
    }
    if (stepNumber === 3) {
      return formElement?.querySelector<HTMLElement>(
        'app-recipe-preparation-step [contenteditable="true"]',
      );
    }
    return formElement?.querySelector<HTMLElement>('#recipe-title');
  }

  /**
   * En modification, « Suivant » est un simple bouton. En création, c'est le bouton d'envoi du
   * formulaire (traité par `submitRecipeForm`) : rien à faire ici, et surtout ne rien renvoyer
   * (renvoyer `false` annulerait l'envoi).
   */
  protected onNextButtonClick(): void {
    if (this.isEditingExistingRecipe()) {
      this.goToNextStep();
    }
  }

  protected goToPreviousStep(): void {
    const currentStep: RecipeFormStepNumber = this.currentStep();
    if (currentStep > FIRST_RECIPE_FORM_STEP) {
      this.goToStep((currentStep - 1) as RecipeFormStepNumber);
    }
  }

  /**
   * Change d'étape dans l'adresse (`?etape=2`) : le bouton Retour du téléphone revient à l'étape
   * précédente au lieu de quitter le formulaire. On remonte en haut du formulaire.
   */
  protected goToStep(stepNumber: RecipeFormStepNumber): void {
    if (!this.canOpenStep(stepNumber)) {
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { etape: stepNumber === FIRST_RECIPE_FORM_STEP ? null : stepNumber },
      queryParamsHandling: 'merge',
    });
    this.documentRef.defaultView?.scrollTo({ top: 0 });
  }

  private areInfoFieldsValid(): boolean {
    return (
      this.recipeForm.title().valid() &&
      this.recipeForm.baseServings().valid() &&
      this.recipeForm.preparationMinutes().valid() &&
      this.recipeForm.cookingMinutes().valid()
    );
  }

  private hasInvalidFieldOnStep(stepNumber: RecipeFormStepNumber): boolean {
    if (stepNumber === 1) {
      return !this.areInfoFieldsValid();
    }
    if (stepNumber === 2) {
      return this.recipeForm.ingredientLines().invalid();
    }
    return this.recipeForm.steps().invalid() || this.recipeForm.descriptionHtml().invalid();
  }

  private findFirstStepWithInvalidField(): RecipeFormStepNumber {
    return (
      this.recipeFormSteps
        .map((formStep: RecipeFormStepDefinition) => formStep.stepNumber)
        .find((stepNumber: RecipeFormStepNumber) => this.hasInvalidFieldOnStep(stepNumber)) ??
      this.currentStep()
    );
  }

  /** Les messages d'erreur des champs s'affichent une fois le champ « touché ». */
  private markStepFieldsAsTouched(stepNumber: RecipeFormStepNumber): void {
    if (stepNumber === 1) {
      this.recipeForm.title().markAsTouched();
      this.recipeForm.baseServings().markAsTouched();
      this.recipeForm.preparationMinutes().markAsTouched();
      this.recipeForm.cookingMinutes().markAsTouched();
    } else if (stepNumber === 2) {
      this.recipeForm.ingredientLines().markAsTouched();
    } else {
      this.recipeForm.steps().markAsTouched();
    }
  }

  private describeStepProblem(stepNumber: RecipeFormStepNumber): string {
    if (stepNumber === 1) {
      return this.recipeForm.title().valid()
        ? 'Indiquez une durée (préparation ou cuisson) et vérifiez le nombre de parts.'
        : 'Donnez un titre à la recette pour continuer.';
    }
    if (stepNumber === 2) {
      return hasNamedIngredientLine(this.recipeFormModel().ingredientLines)
        ? 'Choisissez un type pour chaque nouvel ingrédient, et vérifiez les quantités.'
        : 'Ajoutez au moins un ingrédient pour continuer.';
    }
    return 'Écrivez au moins une étape pour enregistrer la recette.';
  }

  // ---- Brouillon de la nouvelle recette (sur l'appareil) ----

  /** Vrai une fois le brouillon relu : avant, on ne doit pas l'écraser par un formulaire vide. */
  private readonly isDraftSavingActive: WritableSignal<boolean> = signal(false);
  private readonly isDraftRestoredState: WritableSignal<boolean> = signal(false);
  protected readonly isDraftRestored: Signal<boolean> = this.isDraftRestoredState.asReadonly();

  private restoreDraft(): void {
    const recipeDraft: RecipeFormModel | null = parseRecipeDraft(
      this.readStoredValue(RECIPE_DRAFT_STORAGE_KEY),
    );
    if (recipeDraft !== null && !isUntouchedRecipeFormModel(recipeDraft)) {
      this.recipeFormModel.set(recipeDraft);
      this.isDraftRestoredState.set(true);
    }
    this.isDraftSavingActive.set(true);
  }

  private saveDraft(recipeFormModel: RecipeFormModel): void {
    if (isUntouchedRecipeFormModel(recipeFormModel)) {
      this.removeStoredValue(RECIPE_DRAFT_STORAGE_KEY);
    } else {
      this.writeStoredValue(RECIPE_DRAFT_STORAGE_KEY, serializeRecipeDraft(recipeFormModel));
    }
  }

  /** « Recommencer à zéro » : on oublie le brouillon et on repart d'un formulaire vide. */
  protected discardDraft(): void {
    this.removeStoredValue(RECIPE_DRAFT_STORAGE_KEY);
    this.isDraftRestoredState.set(false);
    this.attemptedStepState.set(null);
    this.recipeFormModel.set(createEmptyRecipeFormModel());
    this.goToStep(FIRST_RECIPE_FORM_STEP);
  }

  /** Après l'enregistrement : le brouillon n'a plus lieu d'être. */
  private forgetDraft(): void {
    this.isDraftSavingActive.set(false);
    this.removeStoredValue(RECIPE_DRAFT_STORAGE_KEY);
  }

  // Le stockage de l'appareil peut être indisponible (navigation privée…) : rien ne doit planter.
  private readStoredValue(storageKey: string): string | null {
    try {
      return this.documentRef.defaultView?.localStorage.getItem(storageKey) ?? null;
    } catch {
      return null;
    }
  }

  private writeStoredValue(storageKey: string, storedValue: string): void {
    try {
      this.documentRef.defaultView?.localStorage.setItem(storageKey, storedValue);
    } catch {
      // Pas de brouillon : la saisie continue normalement.
    }
  }

  private removeStoredValue(storageKey: string): void {
    try {
      this.documentRef.defaultView?.localStorage.removeItem(storageKey);
    } catch {
      // Rien à faire.
    }
  }

  /** Après une modification dans « Gérer les tags » : la liste des tags du formulaire suit. */
  protected refreshTags(): void {
    this.tagsResource.reload();
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

  /** Coche ou décoche un tag ; pour la saison, cocher Hiver décoche Été. */
  protected toggleTag(toggledTag: RecipeTag): void {
    const allTags: RecipeTag[] = this.tagsResource.hasValue() ? this.tagsResource.value() : [];
    this.recipeFormModel.update((formModel: RecipeFormModel) => ({
      ...formModel,
      tagIds: toggleRecipeTag(formModel.tagIds, toggledTag, allTags),
    }));
  }

  protected updateNewTagName(inputEvent: Event): void {
    this.newTagName.set((inputEvent.target as HTMLInputElement).value);
  }

  protected updateNewTagCategory(changeEvent: Event): void {
    this.newTagCategory.set((changeEvent.target as HTMLSelectElement).value as TagCategory);
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
        this.toggleTag(existingTag);
      }
      this.newTagName.set('');
      return;
    }
    this.isCreatingTagState.set(true);
    this.tagErrorMessageState.set(null);
    try {
      const createdTag: RecipeTag = await this.tagsApi.createTag(tagName, this.newTagCategory());
      this.tagsResource.update((tags: RecipeTag[] | undefined) =>
        [...(tags ?? []), createdTag].sort(compareTagsByName),
      );
      this.toggleTag(createdTag);
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

  private readonly isDeletingRecipeState: WritableSignal<boolean> = signal(false);
  protected readonly isDeletingRecipe: Signal<boolean> = this.isDeletingRecipeState.asReadonly();

  /** Titre de la recette en cours de modification, pour la fenêtre de confirmation. */
  protected readonly existingRecipeTitle: Signal<string> = computed(() =>
    this.existingRecipeResource.hasValue() ? this.existingRecipeResource.value().title : '',
  );

  /** Après confirmation dans la fenêtre : supprime la recette (et sa photo), puis retour à la liste. */
  protected async deleteExistingRecipe(): Promise<void> {
    if (!this.existingRecipeResource.hasValue()) {
      return;
    }
    const recipe: Recipe = this.existingRecipeResource.value();
    this.isDeletingRecipeState.set(true);
    this.saveErrorMessageState.set(null);
    try {
      await this.recipesApi.deleteRecipe(recipe.id);
      // La photo n'est pas supprimée avec la recette : on retire aussi le fichier du stockage.
      if (recipe.photoPath !== null) {
        await this.recipePhotosApi.deleteRecipePhoto(recipe.photoPath);
      }
      await this.router.navigate(['/recettes']);
    } catch {
      this.saveErrorMessageState.set("La recette n'a pas pu être supprimée. Réessayez.");
    } finally {
      this.isDeletingRecipeState.set(false);
    }
  }

  /**
   * Bouton d'envoi du formulaire (ou Entrée dans un champ). En création, avant la dernière
   * étape : on passe à l'étape suivante. Sinon : on enregistre.
   */
  protected async submitRecipeForm(submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    const isCreatingRecipe: boolean = !this.isEditingExistingRecipe();
    if (isCreatingRecipe && this.currentStep() < LAST_RECIPE_FORM_STEP) {
      this.goToNextStep();
      return;
    }
    if (isCreatingRecipe && !this.completedSteps().has(LAST_RECIPE_FORM_STEP)) {
      this.attemptedStepState.set(LAST_RECIPE_FORM_STEP);
      this.focusFirstProblem(LAST_RECIPE_FORM_STEP);
      return;
    }
    await submit(this.recipeForm, async () => {
      this.saveErrorMessageState.set(null);
      try {
        const savedRecipeId: string = await this.saveRecipe(this.recipeFormModel());
        if (isCreatingRecipe) {
          this.forgetDraft();
        }
        await this.router.navigate(['/recettes', savedRecipeId]);
      } catch {
        this.saveErrorMessageState.set(
          "L'enregistrement a échoué. Vérifiez la connexion et réessayez.",
        );
      }
      return undefined;
    });
    // Champ invalide sur une autre étape (modification) : on ouvre cette étape pour le montrer.
    if (this.recipeForm().invalid()) {
      const invalidStep: RecipeFormStepNumber = this.findFirstStepWithInvalidField();
      this.attemptedStepState.set(invalidStep);
      if (invalidStep !== this.currentStep()) {
        this.goToStep(invalidStep);
      }
      this.focusFirstProblem(invalidStep);
    }
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
      cookingMinutes: formModel.cookingMinutes,
      descriptionHtml: formModel.descriptionHtml,
      origin: formModel.origin,
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

/** Champ de durée vide (un champ nombre vidé peut valoir `null` ou `NaN`). */
function isMissingDuration(durationMinutes: number | null): boolean {
  return durationMinutes === null || Number.isNaN(durationMinutes);
}
