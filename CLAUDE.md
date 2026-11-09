# CLAUDE.md

## Projet

Tastimii : le carnet de recettes de Corentin et Marine, utilisé sur leurs téléphones.

- **Recettes** : titre, nombre de parts de base, durée, ingrédients (quantité + unité), étapes, notes, commentaires.
- **Ingrédients** rangés dans des **familles** en arbre : Cuisses de poulet → Poulet → Viande. Une famille sans parent est un **rayon** de la liste de courses.
- **Liste de courses** : on met des recettes au menu avec un nombre de parts. Les quantités sont recalculées (`parts voulues ÷ parts de base`), additionnées par ingrédient et par unité, puis rangées par rayon, avec des cases à cocher enregistrées en base.
- **Aucune sécurité voulue** : pas de comptes, tout le monde peut tout faire. Les commentaires n'ont pas d'auteur.
- **Pas de temps réel** : la liste se recharge à l'ouverture ou avec le bouton « Actualiser ».

## Stack

- Angular 22, zoneless, composants standalone, signals, Signal Forms, `resource()`, nouveau control flow.
- Supabase (offre gratuite) : Postgres + API générée. Schéma et règles RLS dans `supabase/migrations/`.
  Les types de la base sont écrits à la main dans `core/supabase/database.types.ts` (des `type`, pas des `interface`).
- GitHub Pages, déployé par `.github/workflows/deploy-github-pages.yml` à chaque push sur `main`.
- `.github/workflows/keep-supabase-awake.yml` lit la base tous les 3 jours pour que Supabase ne mette pas le projet en pause.

## Conventions obligatoires

- **Tout typer** : jamais de `any`. Exposer `Signal<T>` en lecture seule, garder `WritableSignal<T>` privé.
- **OnPush partout**, **pas de `ngOnInit`** (`effect()`, `computed()`, `linkedSignal()`, `afterNextRender()`).
- **Templates séparés** : toujours `templateUrl` + fichier `.html`.
- **Nommage métier** : `addRecipeToShoppingList()` pas `add()`, `menuRecipe` pas `item`.
- **Appels Supabase** isolés dans les classes `*Api` de `core/`, une méthode nommée par appel.
- **Logique pure** (calcul des courses, arbre des familles, quantités) dans des fonctions testées, hors des composants.
- **Lisibilité** : `recipes.length > 0` plutôt que `!recipes.length`.
- **Template d'une resource** : `hasValue()` → `error()` → sinon chargement.
- **Lazy loading** : chaque page passe par `loadComponent`.
- **Couleurs** uniquement via les variables CSS de `src/styles.css` (thème clair et sombre).
- **Tailles en rem** (16 px = 1rem, la racine garde la taille du navigateur). Seules les bordures et contours d'1–2 px restent en px.
- **Typographie** : titres en Fraunces (`--font-title`), texte en Atkinson Hyperlegible (`--font-body`), corps à 1.125rem, champs à 1rem minimum (sinon iOS zoome).

## Arborescence

```
src/app/
  core/
    supabase/       client et types de la base
    ingredients/    familles, ingrédients, arbre des familles
    recipes/        recettes, commentaires, calcul des quantités
    shopping-list/  liste de courses et son calcul par rayon
  features/
    recipes/        liste, détail, formulaire (création + modification)
    shopping-list/  page des courses
    ingredients/    gestion des familles et des ingrédients
```

## Git

Conventional Commits en français, minuscules, sans point final (< 72 caractères). Les hooks Husky lancent Prettier, `tsc` et commitlint.

## Commandes

```bash
npm start                  # http://localhost:4200
npm test                   # Vitest en mode watch
npm run test:ci            # Vitest une seule fois
npm run build:github-pages # build avec le base-href du repo
```
