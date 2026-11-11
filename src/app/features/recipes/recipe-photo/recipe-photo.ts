import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Photo d'une recette. Pour l'instant, un emplacement beige avec une assiette :
 * la taille est donnée par le parent (largeur, hauteur ou aspect-ratio).
 */
@Component({
  selector: 'app-recipe-photo',
  templateUrl: './recipe-photo.html',
  styleUrl: './recipe-photo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipePhoto {}
