import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Les paramètres d'URL (ex. `:recipeId`) arrivent directement dans les `input()` des pages.
    // Fondu entre les pages (View Transitions), ignoré par les navigateurs qui ne le gèrent pas.
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
  ],
};
