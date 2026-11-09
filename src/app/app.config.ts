import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Les paramètres d'URL (ex. `:recipeId`) arrivent directement dans les `input()` des pages.
    provideRouter(routes, withComponentInputBinding()),
  ],
};
