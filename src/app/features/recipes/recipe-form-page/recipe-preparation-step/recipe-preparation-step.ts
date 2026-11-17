import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { RichTextEditor } from '../../../../shared/rich-text-editor/rich-text-editor';
import {
  createEmptyStep,
  findStarterStepLegend,
  moveArrayItem,
  RecipeFormStep,
} from '../recipe-form.model';

/**
 * Étape 3 du formulaire de recette : les étapes de préparation (réordonnables par
 * glisser-déposer), puis les astuces et variantes.
 */
@Component({
  selector: 'app-recipe-preparation-step',
  imports: [CdkDrag, CdkDragHandle, CdkDropList, FormField, RichTextEditor],
  templateUrl: './recipe-preparation-step.html',
  styleUrl: './recipe-preparation-step.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipePreparationStep {
  readonly stepsField: InputSignal<FieldTree<RecipeFormStep[]>> =
    input.required<FieldTree<RecipeFormStep[]>>();
  /** Astuces et variantes (texte riche). */
  readonly descriptionField: InputSignal<FieldTree<string>> = input.required<FieldTree<string>>();

  protected readonly findStarterStepLegend: (stepTitle: string) => string | null =
    findStarterStepLegend;

  protected addStep(): void {
    this.updateSteps((steps: RecipeFormStep[]) => [...steps, createEmptyStep()]);
  }

  protected removeStep(removedIndex: number): void {
    this.updateSteps((steps: RecipeFormStep[]) =>
      steps.filter((_step: RecipeFormStep, stepIndex: number) => stepIndex !== removedIndex),
    );
  }

  /** Glisser-déposer d'une étape : l'ordre du formulaire devient l'ordre de la recette. */
  protected moveStep(dropEvent: CdkDragDrop<unknown>): void {
    this.reorderSteps(dropEvent.previousIndex, dropEvent.currentIndex);
  }

  /** Au clavier : flèche haut / bas sur la poignée. */
  protected moveStepByKeyboard(stepIndex: number, direction: -1 | 1, keyboardEvent: Event): void {
    keyboardEvent.preventDefault();
    this.reorderSteps(stepIndex, stepIndex + direction);
  }

  private reorderSteps(previousIndex: number, currentIndex: number): void {
    this.updateSteps((steps: RecipeFormStep[]) =>
      moveArrayItem(steps, previousIndex, currentIndex),
    );
  }

  private updateSteps(changeSteps: (steps: RecipeFormStep[]) => RecipeFormStep[]): void {
    this.stepsField()().value.update(changeSteps);
  }
}
