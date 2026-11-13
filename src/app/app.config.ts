import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Les paramètres d'URL (ex. `:recipeId`) arrivent directement dans les `input()` des pages.
    // Fondu entre les pages (View Transitions), ignoré par les navigateurs qui ne le gèrent pas.
    // Pas de fondu au premier affichage : la page doit apparaître tout de suite, même si l'onglet
    // est encore en arrière-plan (sinon le routeur attend un affichage qui ne vient pas).
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true }),
    ),
  ],
};
