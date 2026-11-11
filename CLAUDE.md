# CLAUDE.md

## Projet

Tastimii : le carnet de recettes de Corentin et Marine, utilisé sur leurs téléphones.

- **Recettes** : titre, nombre de parts de base, durée, photo (bucket Storage public `recipe-photos`, réduite à 1600 px avant l'envoi), description libre en texte riche (en tête de recette, éditeur Tiptap, stockée en HTML), ingrédients (quantité + unité), étapes avec un titre facultatif et un texte riche (`recipe.preparation_steps`, jsonb).
- **Tags** : une recette a zéro, un ou plusieurs tags (`tag`, `recipe_tag`), créés depuis le formulaire. La liste filtre par tags : une recette doit avoir tous les tags choisis.
- **Ingrédients** rangés dans des **familles** en arbre : Cuisses de poulet → Poulet → Viande. Une famille sans parent est un **rayon** de la liste de courses.
- **Liste de courses** : on met des recettes au menu avec un nombre de parts. Les quantités sont recalculées (`parts voulues ÷ parts de base`), additionnées par ingrédient et par unité, puis rangées par rayon, avec des cases à cocher enregistrées en base.
- **Aucune sécurité voulue** : pas de comptes, tout le monde peut tout faire.
- **Pas de temps réel** : la liste se recharge à l'ouverture ou avec le bouton « Actualiser ».

## Données réelles

Depuis le 11/11/2026, Corentin et Marine saisissent leurs vraies recettes. Tout changement de schéma passe par un nouveau script `supabase/migrations/00N_*.sql` qui **reprend les données existantes**. De préférence, ajouter sans supprimer (la version en ligne continue de marcher), et nettoyer les anciennes colonnes dans un script suivant. Pendant les tests, ne créer et ne supprimer que des recettes préfixées `TEST`.

L'ancienne colonne `recipe.steps` (text[]) n'est plus utilisée depuis le script 003 : à supprimer dans un prochain script de nettoyage.

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
- **Couleurs** uniquement via les variables CSS de `src/styles.css`. Thème clair uniquement, pas de thème sombre.
- **Design** : inspiré des sites de cuisine (fond blanc, photos, peu de bordures). Pensé pour desktop, compacté pour mobile : les styles de base sont ceux du mobile, `@media (min-width: 48rem)` pour le desktop. Tailles de texte via `--font-size-*`.
- **Tailles en rem** (16 px = 1rem, la racine garde la taille du navigateur). Seules les bordures et contours d'1–2 px restent en px.
- **Typographie** : titres en Fraunces (`--font-title`), texte en Atkinson Hyperlegible (`--font-body`), corps à 0.9375rem sur mobile et 1.0625rem sur desktop, champs à 1rem minimum (sinon iOS zoome).

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
  shared/
    rich-text-editor/  éditeur de texte riche (Tiptap), compatible `[formField]`
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
