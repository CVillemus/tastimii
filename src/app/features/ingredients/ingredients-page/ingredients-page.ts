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
import { FieldTree, form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import {
  formatIngredientTypeLabel,
  groupIngredientsByType,
  sortIngredientTypesByName,
} from '../../../core/ingredients/ingredient-types';
import {
  Ingredient,
  IngredientCatalog,
  IngredientChanges,
  IngredientType,
  IngredientTypeGroup,
  SUGGESTED_UNITS,
} from '../../../core/ingredients/ingredient.model';
import { IngredientsApi } from '../../../core/ingredients/ingredients-api';

type NewIngredientTypeFormModel = {
  typeName: string;
  typeEmoji: string;
};

type NewIngredientFormModel = {
  ingredientName: string;
  typeId: string;
  defaultUnit: string;
  isUsuallyAtHome: boolean;
};

type IngredientTypeRenameFormModel = {
  typeName: string;
  typeEmoji: string;
};

/** Un emoji peut compter plusieurs caractères (🌶️ = 2) : on laisse de la marge. */
const TYPE_EMOJI_MAX_LENGTH: number = 8;

/** Message affiché sous un ingrédient dont la suppression a été refusée. */
type IngredientDeletionRefusal = {
  ingredientId: string;
  message: string;
};

/** Gestion des types d'ingrédients (les rayons des courses) et des ingrédients. */
@Component({
  selector: 'app-ingredients-page',
  imports: [FormField],
  templateUrl: './ingredients-page.html',
  styleUrl: './ingredients-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsPage {
  /** Types gris affichés pendant le chargement. */
  protected readonly skeletonIngredientTypes: readonly number[] = [1, 2, 3];

  private readonly ingredientsApi: IngredientsApi = inject(IngredientsApi);

  protected readonly ingredientCatalogResource: ResourceRef<IngredientCatalog | undefined> =
    resource({
      loader: (): Promise<IngredientCatalog> => this.ingredientsApi.fetchIngredientCatalog(),
    });

  protected readonly ingredientTypeGroups: Signal<IngredientTypeGroup[]> = computed(() =>
    this.ingredientCatalogResource.hasValue()
      ? groupIngredientsByType(
          this.ingredientCatalogResource.value().types,
          this.ingredientCatalogResource.value().ingredients,
        )
      : [],
  );

  protected readonly sortedIngredientTypes: Signal<IngredientType[]> = computed(() =>
    this.ingredientCatalogResource.hasValue()
      ? sortIngredientTypesByName(this.ingredientCatalogResource.value().types)
      : [],
  );

  protected readonly suggestedUnits: readonly string[] = SUGGESTED_UNITS;
  protected readonly formatIngredientTypeLabel: (ingredientType: IngredientType) => string =
    formatIngredientTypeLabel;

  private readonly actionErrorMessageState: WritableSignal<string | null> = signal(null);
  protected readonly actionErrorMessage: Signal<string | null> =
    this.actionErrorMessageState.asReadonly();

  private readonly ingredientDeletionRefusalState: WritableSignal<IngredientDeletionRefusal | null> =
    signal(null);
  protected readonly ingredientDeletionRefusal: Signal<IngredientDeletionRefusal | null> =
    this.ingredientDeletionRefusalState.asReadonly();

  // ---- Ajout ----

  private readonly newIngredientTypeFormModel: WritableSignal<NewIngredientTypeFormModel> = signal({
    typeName: '',
    typeEmoji: '',
  });
  protected readonly newIngredientTypeForm: FieldTree<NewIngredientTypeFormModel> = form(
    this.newIngredientTypeFormModel,
    (newIngredientTypePath) => {
      required(newIngredientTypePath.typeName, { message: 'Donnez un nom au type.' });
      maxLength(newIngredientTypePath.typeEmoji, TYPE_EMOJI_MAX_LENGTH, {
        message: 'Un seul emoji suffit.',
      });
    },
  );

  private readonly newIngredientFormModel: WritableSignal<NewIngredientFormModel> = signal({
    ingredientName: '',
    typeId: '',
    defaultUnit: '',
    isUsuallyAtHome: false,
  });
  protected readonly newIngredientForm: FieldTree<NewIngredientFormModel> = form(
    this.newIngredientFormModel,
    (newIngredientPath) => {
      required(newIngredientPath.ingredientName, { message: "Donnez un nom à l'ingrédient." });
      required(newIngredientPath.typeId, { message: 'Choisissez un type.' });
    },
  );

  // ---- Modification d'un ingrédient (un seul à la fois) ----

  private readonly editedIngredientIdState: WritableSignal<string | null> = signal(null);
  protected readonly editedIngredientId: Signal<string | null> =
    this.editedIngredientIdState.asReadonly();

  private readonly ingredientEditFormModel: WritableSignal<IngredientChanges> = signal({
    name: '',
    typeId: '',
    defaultUnit: '',
    isUsuallyAtHome: false,
  });
  protected readonly ingredientEditForm: FieldTree<IngredientChanges> = form(
    this.ingredientEditFormModel,
    (ingredientEditPath) => {
      required(ingredientEditPath.name, { message: "Donnez un nom à l'ingrédient." });
      required(ingredientEditPath.typeId, { message: 'Choisissez un type.' });
    },
  );

  // ---- Renommage d'un type (un seul à la fois) ----

  private readonly renamedTypeIdState: WritableSignal<string | null> = signal(null);
  protected readonly renamedTypeId: Signal<string | null> = this.renamedTypeIdState.asReadonly();

  private readonly typeRenameFormModel: WritableSignal<IngredientTypeRenameFormModel> = signal({
    typeName: '',
    typeEmoji: '',
  });
  protected readonly typeRenameForm: FieldTree<IngredientTypeRenameFormModel> = form(
    this.typeRenameFormModel,
    (typeRenamePath) => {
      required(typeRenamePath.typeName, { message: 'Donnez un nom au type.' });
      maxLength(typeRenamePath.typeEmoji, TYPE_EMOJI_MAX_LENGTH, {
        message: 'Un seul emoji suffit.',
      });
    },
  );

  protected async submitNewIngredientTypeForm(submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    await submit(this.newIngredientTypeForm, async () => {
      const { typeName, typeEmoji }: NewIngredientTypeFormModel = this.newIngredientTypeFormModel();
      await this.runCatalogAction(
        () => this.ingredientsApi.createIngredientType(typeName, typeEmoji),
        'Ce type existe peut-être déjà.',
      );
      this.newIngredientTypeForm().reset({ typeName: '', typeEmoji: '' });
      return undefined;
    });
  }

  protected async submitNewIngredientForm(submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    await submit(this.newIngredientForm, async () => {
      const { ingredientName, typeId, defaultUnit, isUsuallyAtHome }: NewIngredientFormModel =
        this.newIngredientFormModel();
      await this.runCatalogAction(
        () =>
          this.ingredientsApi.createIngredient(
            ingredientName,
            typeId,
            defaultUnit,
            isUsuallyAtHome,
          ),
        'Cet ingrédient existe peut-être déjà.',
      );
      // On garde le type choisi : on ajoute souvent plusieurs ingrédients d'un même rayon.
      this.newIngredientForm().reset({
        ingredientName: '',
        typeId,
        defaultUnit: '',
        isUsuallyAtHome: false,
      });
      return undefined;
    });
  }

  protected startEditingIngredient(ingredient: Ingredient): void {
    this.renamedTypeIdState.set(null);
    this.ingredientDeletionRefusalState.set(null);
    this.ingredientEditForm().reset({
      name: ingredient.name,
      typeId: ingredient.typeId,
      defaultUnit: ingredient.defaultUnit,
      isUsuallyAtHome: ingredient.isUsuallyAtHome,
    });
    this.editedIngredientIdState.set(ingredient.id);
  }

  protected cancelEditingIngredient(): void {
    this.editedIngredientIdState.set(null);
  }

  protected async submitIngredientEditForm(
    ingredient: Ingredient,
    submitEvent: Event,
  ): Promise<void> {
    submitEvent.preventDefault();
    await submit(this.ingredientEditForm, async () => {
      const ingredientChanges: IngredientChanges = this.ingredientEditFormModel();
      const isSaved: boolean = await this.runCatalogAction(
        () => this.ingredientsApi.updateIngredient(ingredient.id, ingredientChanges),
        `Impossible d'enregistrer « ${ingredientChanges.name} » : ce nom existe peut-être déjà.`,
      );
      if (isSaved) {
        this.editedIngredientIdState.set(null);
      }
      return undefined;
    });
  }

  /** Bascule rapide « souvent à la maison », sans ouvrir la modification. */
  protected async toggleIngredientUsuallyAtHome(ingredient: Ingredient): Promise<void> {
    await this.runCatalogAction(
      () =>
        this.ingredientsApi.updateIngredient(ingredient.id, {
          name: ingredient.name,
          typeId: ingredient.typeId,
          defaultUnit: ingredient.defaultUnit,
          isUsuallyAtHome: !ingredient.isUsuallyAtHome,
        }),
      `Impossible de modifier « ${ingredient.name} ».`,
    );
  }

  protected startRenamingType(ingredientType: IngredientType): void {
    this.editedIngredientIdState.set(null);
    this.typeRenameForm().reset({
      typeName: ingredientType.name,
      typeEmoji: ingredientType.emoji,
    });
    this.renamedTypeIdState.set(ingredientType.id);
  }

  protected cancelRenamingType(): void {
    this.renamedTypeIdState.set(null);
  }

  protected async submitTypeRenameForm(
    ingredientType: IngredientType,
    submitEvent: Event,
  ): Promise<void> {
    submitEvent.preventDefault();
    await submit(this.typeRenameForm, async () => {
      const { typeName, typeEmoji }: IngredientTypeRenameFormModel = this.typeRenameFormModel();
      const isSaved: boolean = await this.runCatalogAction(
        () => this.ingredientsApi.updateIngredientType(ingredientType.id, typeName, typeEmoji),
        `Impossible de renommer « ${ingredientType.name} » : ce nom existe peut-être déjà.`,
      );
      if (isSaved) {
        this.renamedTypeIdState.set(null);
      }
      return undefined;
    });
  }

  protected async deleteIngredient(ingredient: Ingredient): Promise<void> {
    this.ingredientDeletionRefusalState.set(null);
    if (!confirm(`Supprimer l'ingrédient « ${ingredient.name} » ?`)) {
      return;
    }
    try {
      await this.ingredientsApi.deleteIngredient(ingredient.id);
      this.ingredientCatalogResource.reload();
    } catch {
      this.ingredientDeletionRefusalState.set({
        ingredientId: ingredient.id,
        message: await this.explainIngredientDeletionRefusal(ingredient),
      });
    }
  }

  protected async deleteIngredientType(ingredientTypeGroup: IngredientTypeGroup): Promise<void> {
    const { ingredientType, ingredients }: IngredientTypeGroup = ingredientTypeGroup;
    if (ingredients.length > 0) {
      this.actionErrorMessageState.set(
        `« ${ingredientType.name} » contient encore des ingrédients : changez-les de type d'abord.`,
      );
      return;
    }
    if (!confirm(`Supprimer le type « ${ingredientType.name} » ?`)) {
      return;
    }
    await this.runCatalogAction(
      () => this.ingredientsApi.deleteIngredientType(ingredientType.id),
      `Impossible de supprimer « ${ingredientType.name} ».`,
    );
  }

  /** « Utilisé dans Lentilles saucisse : retirez-le d'abord de cette recette. » */
  private async explainIngredientDeletionRefusal(ingredient: Ingredient): Promise<string> {
    try {
      const recipeTitles: string[] = await this.ingredientsApi.fetchRecipeTitlesUsingIngredient(
        ingredient.id,
      );
      if (recipeTitles.length === 1) {
        return `Utilisé dans « ${recipeTitles[0]} » : retirez-le d'abord de cette recette.`;
      }
      if (recipeTitles.length > 1) {
        const quotedTitles: string = recipeTitles
          .map((recipeTitle: string) => `« ${recipeTitle} »`)
          .join(', ');
        return `Utilisé dans ${quotedTitles} : retirez-le d'abord de ces recettes.`;
      }
    } catch {
      // On retombe sur le message générique.
    }
    return `Impossible de supprimer « ${ingredient.name} ». Vérifiez la connexion.`;
  }

  /**
   * Lance une modification du catalogue, affiche `failureMessage` si elle échoue, puis recharge.
   * Renvoie `true` si la modification a réussi.
   */
  private async runCatalogAction(
    catalogAction: () => Promise<unknown>,
    failureMessage: string,
  ): Promise<boolean> {
    this.actionErrorMessageState.set(null);
    let isSuccessful: boolean = true;
    try {
      await catalogAction();
    } catch {
      this.actionErrorMessageState.set(failureMessage);
      isSuccessful = false;
    }
    this.ingredientCatalogResource.reload();
    return isSuccessful;
  }
}
