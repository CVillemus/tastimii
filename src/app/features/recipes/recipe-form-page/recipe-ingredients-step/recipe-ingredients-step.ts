import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  InputSignal,
  Signal,
} from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { formatIngredientTypeLabel } from '../../../../core/ingredients/ingredient-types';
import {
  Ingredient,
  IngredientType,
  SUGGESTED_UNITS,
} from '../../../../core/ingredients/ingredient.model';
import { formatReadableQuantityHint } from '../../../../core/recipes/quantity';
import {
  buildUnitChoices,
  COUNT_UNIT_CHOICE,
  createEmptyIngredientLine,
  isNewIngredientName,
  moveArrayItem,
  NO_UNIT_CHOICE,
  normalizeIngredientName,
  RecipeFormIngredientLine,
  UnitChoice,
} from '../recipe-form.model';

/**
 * Étape 2 du formulaire de recette : la liste des ingrédients (nom, quantité, unité), qu'on
 * réordonne par glisser-déposer. Un nom inconnu demande son type : l'ingrédient sera créé à
 * l'enregistrement.
 */
@Component({
  selector: 'app-recipe-ingredients-step',
  imports: [CdkDrag, CdkDragHandle, CdkDropList, FormField],
  templateUrl: './recipe-ingredients-step.html',
  styleUrl: './recipe-ingredients-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeIngredientsStep {
  readonly ingredientLinesField: InputSignal<FieldTree<RecipeFormIngredientLine[]>> =
    input.required<FieldTree<RecipeFormIngredientLine[]>>();
  readonly knownIngredients: InputSignal<Ingredient[]> = input.required<Ingredient[]>();
  readonly ingredientTypes: InputSignal<IngredientType[]> = input.required<IngredientType[]>();

  protected readonly unitChoices: readonly UnitChoice[] = buildUnitChoices(SUGGESTED_UNITS);
  private readonly listedUnitChoiceValues: ReadonlySet<string> = new Set(
    this.unitChoices.map((unitChoice: UnitChoice) => unitChoice.value),
  );
  protected readonly formatIngredientTypeLabel: (ingredientType: IngredientType) => string =
    formatIngredientTypeLabel;
  protected readonly formatReadableQuantityHint: (
    quantity: number | null,
    unit: string,
  ) => string | null = formatReadableQuantityHint;

  private readonly ingredientsByNormalizedName: Signal<Map<string, Ingredient>> = computed(
    () =>
      new Map(
        this.knownIngredients().map((ingredient: Ingredient) => [
          normalizeIngredientName(ingredient.name),
          ingredient,
        ]),
      ),
  );

  /** Vrai si un nom est tapé et ne correspond à aucun ingrédient connu. */
  protected isNewIngredientName(ingredientName: string): boolean {
    return isNewIngredientName(ingredientName, this.ingredientsByNormalizedName());
  }

  /** En choisissant un ingrédient connu, on reprend son unité habituelle si « nb » est choisi. */
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
    this.updateIngredientLines((ingredientLines: RecipeFormIngredientLine[]) => [
      ...ingredientLines,
      createEmptyIngredientLine(),
    ]);
  }

  protected removeIngredientLine(removedIndex: number): void {
    this.updateIngredientLines((ingredientLines: RecipeFormIngredientLine[]) =>
      ingredientLines.filter(
        (_ingredientLine: RecipeFormIngredientLine, lineIndex: number) =>
          lineIndex !== removedIndex,
      ),
    );
  }

  /** Glisser-déposer d'un ingrédient : l'ordre du formulaire devient l'ordre d'affichage. */
  protected moveIngredientLine(dropEvent: CdkDragDrop<unknown>): void {
    this.reorderIngredientLines(dropEvent.previousIndex, dropEvent.currentIndex);
  }

  /** Au clavier : flèche haut / bas sur la poignée. */
  protected moveIngredientLineByKeyboard(
    lineIndex: number,
    direction: -1 | 1,
    keyboardEvent: Event,
  ): void {
    keyboardEvent.preventDefault();
    this.reorderIngredientLines(lineIndex, lineIndex + direction);
  }

  private reorderIngredientLines(previousIndex: number, currentIndex: number): void {
    this.updateIngredientLines((ingredientLines: RecipeFormIngredientLine[]) =>
      moveArrayItem(ingredientLines, previousIndex, currentIndex),
    );
  }

  private updateIngredientLines(
    changeIngredientLines: (
      ingredientLines: RecipeFormIngredientLine[],
    ) => RecipeFormIngredientLine[],
  ): void {
    this.ingredientLinesField()().value.update(changeIngredientLines);
  }
}
