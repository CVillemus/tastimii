import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { KitchenStore } from './core/kitchen/kitchen-store';

/** Coquille de l'application : en-tête avec la navigation (en bas de l'écran sur mobile), page courante. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  /** L'onglet Cuisine n'apparaît que s'il y a des recettes à cuisiner. */
  protected readonly kitchenStore: KitchenStore = inject(KitchenStore);

  constructor() {
    void this.kitchenStore.refreshKitchenRecipeCount();
  }
}
