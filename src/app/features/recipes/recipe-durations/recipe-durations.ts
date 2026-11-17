import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  InputSignal,
  Signal,
} from '@angular/core';
import { describeRecipeDurations, RecipeDurationLabels } from '../../../core/recipes/quantity';

/**
 * Durées d'une recette, chacune avec son icône : planche et couteau pour la préparation, cocotte
 * qui fume pour la cuisson. Utilisé sur la fiche recette et sur les cartes de la liste.
 */
@Component({
  selector: 'app-recipe-durations',
  templateUrl: './recipe-durations.html',
  styleUrl: './recipe-durations.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDurations {
  readonly preparationMinutes: InputSignal<number | null> = input.required<number | null>();
  readonly cookingMinutes: InputSignal<number | null> = input.required<number | null>();

  protected readonly durationLabels: Signal<RecipeDurationLabels | null> = computed(() =>
    describeRecipeDurations(this.preparationMinutes(), this.cookingMinutes()),
  );
}
