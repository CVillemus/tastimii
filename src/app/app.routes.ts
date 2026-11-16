import { Routes } from '@angular/router';
import { kitchenNotEmptyGuard } from './core/kitchen/kitchen-not-empty-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'recettes' },
  {
    path: 'recettes',
    title: 'Recettes · Tastimii',
    loadComponent: () =>
      import('./features/recipes/recipe-list-page/recipe-list-page').then(
        (module) => module.RecipeListPage,
      ),
  },
  {
    path: 'recettes/nouvelle',
    title: 'Nouvelle recette · Tastimii',
    loadComponent: () =>
      import('./features/recipes/recipe-form-page/recipe-form-page').then(
        (module) => module.RecipeFormPage,
      ),
  },
  {
    path: 'recettes/:recipeId',
    title: 'Recette · Tastimii',
    loadComponent: () =>
      import('./features/recipes/recipe-detail-page/recipe-detail-page').then(
        (module) => module.RecipeDetailPage,
      ),
  },
  {
    path: 'recettes/:recipeId/modifier',
    title: 'Modifier la recette · Tastimii',
    loadComponent: () =>
      import('./features/recipes/recipe-form-page/recipe-form-page').then(
        (module) => module.RecipeFormPage,
      ),
  },
  {
    path: 'courses',
    title: 'Courses · Tastimii',
    loadComponent: () =>
      import('./features/shopping-list/shopping-list-page/shopping-list-page').then(
        (module) => module.ShoppingListPage,
      ),
  },
  {
    path: 'cuisine',
    title: 'Cuisine · Tastimii',
    canActivate: [kitchenNotEmptyGuard],
    loadComponent: () =>
      import('./features/kitchen/kitchen-page/kitchen-page').then((module) => module.KitchenPage),
  },
  {
    path: 'ingredients',
    title: 'Ingrédients · Tastimii',
    loadComponent: () =>
      import('./features/ingredients/ingredients-page/ingredients-page').then(
        (module) => module.IngredientsPage,
      ),
  },
  { path: '**', redirectTo: 'recettes' },
];
