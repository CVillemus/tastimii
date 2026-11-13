import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { KitchenStore } from './kitchen-store';

/** La page Cuisine n'est disponible que s'il y a des recettes à cuisiner ; sinon, retour aux recettes. */
export const kitchenNotEmptyGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const kitchenStore: KitchenStore = inject(KitchenStore);
  const router: Router = inject(Router);
  const kitchenRecipeCount: number = await kitchenStore.refreshKitchenRecipeCount();
  return kitchenRecipeCount > 0 ? true : router.createUrlTree(['/recettes']);
};
