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
import { FieldTree, form, FormField, required, submit } from '@angular/forms/signals';
import {
  groupIngredientsByType,
  sortIngredientTypesByName,
} from '../../../core/ingredients/ingredient-types';
import {
  Ingredient,
  IngredientCatalog,
  IngredientType,
  IngredientTypeGroup,
  SUGGESTED_UNITS,
} from '../../../core/ingredients/ingredient.model';
import { IngredientsApi } from '../../../core/ingredients/ingredients-api';

type NewIngredientTypeFormModel = {
  typeName: string;
};

type NewIngredientFormModel = {
  ingredientName: string;
  typeId: string;
  defaultUnit: string;
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

  private readonly actionErrorMessageState: WritableSignal<string | null> = signal(null);
  protected readonly actionErrorMessage: Signal<string | null> =
    this.actionErrorMessageState.asReadonly();

  private readonly newIngredientTypeFormModel: WritableSignal<NewIngredientTypeFormModel> = signal({
    typeName: '',
  });
  protected readonly newIngredientTypeForm: FieldTree<NewIngredientTypeFormModel> = form(
    this.newIngredientTypeFormModel,
    (newIngredientTypePath) => {
      required(newIngredientTypePath.typeName, { message: 'Donnez un nom au type.' });
    },
  );

  private readonly newIngredientFormModel: WritableSignal<NewIngredientFormModel> = signal({
    ingredientName: '',
    typeId: '',
    defaultUnit: '',
  });
  protected readonly newIngredientForm: FieldTree<NewIngredientFormModel> = form(
    this.newIngredientFormModel,
    (newIngredientPath) => {
      required(newIngredientPath.ingredientName, { message: "Donnez un nom à l'ingrédient." });
      required(newIngredientPath.typeId, { message: 'Choisissez un type.' });
    },
  );

  protected async submitNewIngredientTypeForm(submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    await submit(this.newIngredientTypeForm, async () => {
      const { typeName }: NewIngredientTypeFormModel = this.newIngredientTypeFormModel();
      await this.runCatalogAction(
        () => this.ingredientsApi.createIngredientType(typeName),
        'Ce type existe peut-être déjà.',
      );
      this.newIngredientTypeForm().reset({ typeName: '' });
      return undefined;
    });
  }

  protected async submitNewIngredientForm(submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    await submit(this.newIngredientForm, async () => {
      const { ingredientName, typeId, defaultUnit }: NewIngredientFormModel =
        this.newIngredientFormModel();
      await this.runCatalogAction(
        () => this.ingredientsApi.createIngredient(ingredientName, typeId, defaultUnit),
        'Cet ingrédient existe peut-être déjà.',
      );
      // On garde le type choisi : on ajoute souvent plusieurs ingrédients d'un même rayon.
      this.newIngredientForm().reset({ ingredientName: '', typeId, defaultUnit: '' });
      return undefined;
    });
  }

  protected async changeIngredientType(ingredient: Ingredient, changeEvent: Event): Promise<void> {
    const newTypeId: string = (changeEvent.target as HTMLSelectElement).value;
    await this.runCatalogAction(
      () => this.ingredientsApi.changeIngredientType(ingredient.id, newTypeId),
      `Impossible de changer le type de « ${ingredient.name} ».`,
    );
  }

  protected async deleteIngredient(ingredient: Ingredient): Promise<void> {
    if (!confirm(`Supprimer l'ingrédient « ${ingredient.name} » ?`)) {
      return;
    }
    await this.runCatalogAction(
      () => this.ingredientsApi.deleteIngredient(ingredient.id),
      `« ${ingredient.name} » est utilisé dans une recette : retirez-le d'abord de la recette.`,
    );
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

  /** Lance une modification du catalogue, affiche `failureMessage` si elle échoue, puis recharge. */
  private async runCatalogAction(
    catalogAction: () => Promise<unknown>,
    failureMessage: string,
  ): Promise<void> {
    this.actionErrorMessageState.set(null);
    try {
      await catalogAction();
    } catch {
      this.actionErrorMessageState.set(failureMessage);
    }
    this.ingredientCatalogResource.reload();
  }
}
