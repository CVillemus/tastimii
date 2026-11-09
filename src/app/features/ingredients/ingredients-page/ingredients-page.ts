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
  buildFamilyTree,
  formatFamilyPath,
} from '../../../core/ingredients/ingredient-family-tree';
import {
  Ingredient,
  IngredientCatalog,
  IngredientFamily,
  IngredientFamilyTreeEntry,
  SUGGESTED_UNITS,
} from '../../../core/ingredients/ingredient.model';
import { IngredientsApi } from '../../../core/ingredients/ingredients-api';

type NewFamilyFormModel = {
  familyName: string;
  parentFamilyId: string;
};

type NewIngredientFormModel = {
  ingredientName: string;
  familyId: string;
  defaultUnit: string;
};

/** Famille proposée dans les listes déroulantes, avec son chemin complet. */
type FamilyOption = {
  familyId: string;
  label: string;
};

/** Indentation d'une sous-famille dans l'arbre, par niveau. */
const FAMILY_INDENT_REM: number = 1.25;

/** Gestion des familles (rayons et sous-familles) et des ingrédients. */
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

  protected readonly familyTree: Signal<IngredientFamilyTreeEntry[]> = computed(() =>
    this.ingredientCatalogResource.hasValue()
      ? buildFamilyTree(
          this.ingredientCatalogResource.value().families,
          this.ingredientCatalogResource.value().ingredients,
        )
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
    return this.familyTree().map((familyTreeEntry: IngredientFamilyTreeEntry): FamilyOption => ({
      familyId: familyTreeEntry.family.id,
      label: formatFamilyPath(familyTreeEntry.family.id, familiesById),
    }));
  });

  protected readonly suggestedUnits: readonly string[] = SUGGESTED_UNITS;
  protected readonly familyIndentRem: number = FAMILY_INDENT_REM;

  private readonly actionErrorMessageState: WritableSignal<string | null> = signal(null);
  protected readonly actionErrorMessage: Signal<string | null> =
    this.actionErrorMessageState.asReadonly();

  private readonly newFamilyFormModel: WritableSignal<NewFamilyFormModel> = signal({
    familyName: '',
    parentFamilyId: '',
  });
  protected readonly newFamilyForm: FieldTree<NewFamilyFormModel> = form(
    this.newFamilyFormModel,
    (newFamilyPath) => {
      required(newFamilyPath.familyName, { message: 'Donnez un nom à la famille.' });
    },
  );

  private readonly newIngredientFormModel: WritableSignal<NewIngredientFormModel> = signal({
    ingredientName: '',
    familyId: '',
    defaultUnit: '',
  });
  protected readonly newIngredientForm: FieldTree<NewIngredientFormModel> = form(
    this.newIngredientFormModel,
    (newIngredientPath) => {
      required(newIngredientPath.ingredientName, { message: "Donnez un nom à l'ingrédient." });
      required(newIngredientPath.familyId, { message: 'Choisissez une famille.' });
    },
  );

  protected async submitNewFamilyForm(submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    await submit(this.newFamilyForm, async () => {
      const { familyName, parentFamilyId }: NewFamilyFormModel = this.newFamilyFormModel();
      await this.runCatalogAction(
        () =>
          this.ingredientsApi.createIngredientFamily(
            familyName,
            parentFamilyId === '' ? null : parentFamilyId,
          ),
        'Cette famille existe peut-être déjà.',
      );
      this.newFamilyForm().reset({ familyName: '', parentFamilyId: '' });
      return undefined;
    });
  }

  protected async submitNewIngredientForm(submitEvent: Event): Promise<void> {
    submitEvent.preventDefault();
    await submit(this.newIngredientForm, async () => {
      const { ingredientName, familyId, defaultUnit }: NewIngredientFormModel =
        this.newIngredientFormModel();
      await this.runCatalogAction(
        () => this.ingredientsApi.createIngredient(ingredientName, familyId, defaultUnit),
        'Cet ingrédient existe peut-être déjà.',
      );
      // On garde la famille choisie : on ajoute souvent plusieurs ingrédients d'un même rayon.
      this.newIngredientForm().reset({ ingredientName: '', familyId, defaultUnit: '' });
      return undefined;
    });
  }

  protected async moveIngredientToFamily(
    ingredient: Ingredient,
    changeEvent: Event,
  ): Promise<void> {
    const newFamilyId: string = (changeEvent.target as HTMLSelectElement).value;
    await this.runCatalogAction(
      () => this.ingredientsApi.moveIngredientToFamily(ingredient.id, newFamilyId),
      "Impossible de déplacer l'ingrédient.",
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

  protected async deleteIngredientFamily(family: IngredientFamily): Promise<void> {
    if (!confirm(`Supprimer la famille « ${family.name} » ?`)) {
      return;
    }
    await this.runCatalogAction(
      () => this.ingredientsApi.deleteIngredientFamily(family.id),
      `« ${family.name} » contient encore des ingrédients ou des sous-familles.`,
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
