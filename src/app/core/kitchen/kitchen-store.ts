import {
  computed,
  inject,
  Injectable,
  Injector,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';

/**
 * Nombre de recettes en cuisine, partagé par toute l'app : l'onglet Cuisine n'apparaît que
 * s'il y en a. À rafraîchir après chaque changement (courses faites, cuisinée, retirée).
 *
 * Utilisé dès le démarrage par la navigation : l'API (et la librairie Supabase derrière) est
 * chargée à la demande, pour ne pas alourdir le tout premier fichier téléchargé.
 */
@Injectable({ providedIn: 'root' })
export class KitchenStore {
  private readonly injector: Injector = inject(Injector);

  private readonly kitchenRecipeCountState: WritableSignal<number> = signal(0);
  readonly kitchenRecipeCount: Signal<number> = this.kitchenRecipeCountState.asReadonly();
  readonly hasKitchenRecipes: Signal<boolean> = computed(() => this.kitchenRecipeCount() > 0);

  /** Relit le nombre en base. En cas d'erreur réseau, garde la dernière valeur connue. */
  async refreshKitchenRecipeCount(): Promise<number> {
    try {
      const { KitchenApi } = await import('./kitchen-api');
      this.kitchenRecipeCountState.set(await this.injector.get(KitchenApi).countKitchenRecipes());
    } catch {
      // Hors ligne : l'onglet garde son dernier état.
    }
    return this.kitchenRecipeCount();
  }

  setKitchenRecipeCount(kitchenRecipeCount: number): void {
    this.kitchenRecipeCountState.set(kitchenRecipeCount);
  }
}
