import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';

/**
 * Photo d'une recette, recadrée pour remplir son emplacement. Sans photo, un emplacement
 * beige avec une assiette. La taille est donnée par le parent (largeur, hauteur…).
 */
@Component({
  selector: 'app-recipe-photo',
  templateUrl: './recipe-photo.html',
  styleUrl: './recipe-photo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Permet au parent de styler différemment une vraie photo et l'emplacement vide.
  host: { '[class.recipe-photo--with-photo]': 'photoUrl() !== null' },
})
export class RecipePhoto {
  readonly photoUrl: InputSignal<string | null> = input.required<string | null>();
  /** Texte alternatif ; vide pour une vignette décorative à côté du titre. */
  readonly photoDescription: InputSignal<string> = input<string>('');
}
