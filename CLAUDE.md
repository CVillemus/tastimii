# CLAUDE.md

## Projet

Tastimii : le carnet de recettes de Corentin et Marine, utilisé sur leurs téléphones.

- **Recettes** : titre, nombre de parts de base, durée, photo (bucket Storage public `recipe-photos`, réduite à 1600 px avant l'envoi), description libre en texte riche (en tête de recette, éditeur Tiptap, stockée en HTML), ingrédients (quantité + unité), étapes avec un titre facultatif et un texte riche (`recipe.preparation_steps`, jsonb). Une nouvelle recette démarre avec 4 étapes proposées (`STARTER_RECIPE_STEPS` : Le calme avant la tempête, Le coup de feu, Lâcher prise, Le bouquet final), avec une légende dans le formulaire tant que le nom est gardé ; modifiables, supprimables, réordonnables par glisser-déposer.
- **Tags** : une recette a zéro, un ou plusieurs tags (`tag`, `recipe_tag`), créés depuis le formulaire. La liste filtre par tags : une recette doit avoir tous les tags choisis.
- **Ingrédients** : chacun a directement un **type** (Cuisses de poulet → Viande), sans sous-types. Le type est le **rayon** de la liste de courses. En base, un type est une ligne de `ingredient_family` (l'ingrédient pointe dessus par `family_id`) ; dans le code, on parle de `IngredientType` / `typeId`.
- **Unités** : poids et volumes stockés dans la plus petite unité (g, mL), affichés dans la plus lisible (`toReadableQuantity` : 1500 g → 1,5 kg, 250 mL → 25 cL, 1000 mL → 1 L). Cuillères abrégées : cs, cc. Les anciennes écritures (ml, c. à soupe…) sont affichées sous leur forme abrégée (`formatUnit`). Dans le formulaire, « nb » = unité vide avec quantité (4 diots), « Aucune unité » = unité vide sans quantité (au goût).
- **Liste de courses** : on met des recettes au menu avec un nombre de parts, depuis la fiche recette ou directement depuis la vignette de la liste des recettes (bouton panier, puis compteur « − N parts + » ; calcul dans `core/shopping-list/recipe-menu-status.ts`). Les quantités sont recalculées (`parts voulues ÷ parts de base`), additionnées par ingrédient et par unité, puis rangées par rayon, avec des cases à cocher enregistrées en base.
- **Souvent à la maison** (`ingredient.is_usually_at_home`) : ces ingrédients (sel, beurre, bouillon…) ne vont pas d'office dans la liste mais dans « À vérifier avant de partir », avec la quantité par recette. Cochés « à acheter » (clé `a-acheter|<ingredient_id>` dans `shopping_list_checked_line`), ils rejoignent leur rayon.
- **Aucune sécurité voulue** : pas de comptes, tout le monde peut tout faire.
- **Pas de temps réel** : la liste se recharge à l'ouverture ou avec le bouton « Actualiser ».

## Données réelles

Depuis le 11/11/2026, Corentin et Marine saisissent leurs vraies recettes. Tout changement de schéma passe par un nouveau script `supabase/migrations/00N_*.sql` qui **reprend les données existantes**. De préférence, ajouter sans supprimer (la version en ligne continue de marcher), et nettoyer les anciennes colonnes dans un script suivant. Pendant les tests, ne créer et ne supprimer que des recettes préfixées `TEST`.

À supprimer dans un prochain script de nettoyage :
- l'ancienne colonne `recipe.steps` (text[]), plus utilisée depuis le script 003 ;
- la colonne `ingredient_family.parent_family_id` (toujours `null` depuis le script 005) et sa contrainte `ingredient_family_sans_parent`.

## Stack

- Angular 22, zoneless, composants standalone, signals, Signal Forms, `resource()`, nouveau control flow.
- `@angular/cdk` pour le glisser-déposer (ordre des ingrédients et des étapes dans le formulaire, au doigt comme à la souris).
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
- **Logique pure** (calcul des courses, regroupement par type, quantités) dans des fonctions testées, hors des composants.
- **Lisibilité** : `recipes.length > 0` plutôt que `!recipes.length`.
- **Template d'une resource** : `hasValue()` → `error()` → sinon chargement.
- **Lazy loading** : chaque page passe par `loadComponent`.
- **Couleurs** uniquement via les variables CSS de `src/styles.css`. Thème clair uniquement, pas de thème sombre.
- **Design** : inspiré des sites de cuisine (fond blanc cassé, cartes blanches à ombre douce, photos, peu de bordures). Pensé pour desktop, compacté pour mobile : les styles de base sont ceux du mobile, `@media (min-width: 48rem)` pour le desktop. Tailles de texte via `--font-size-*`.
- **Desktop ≠ mobile agrandi** : sur desktop, les pages utilisent la largeur (`.page-columns` + `.page-columns__sidebar` collante, grilles de cartes) au lieu d'une colonne étroite.
- **Tailles en rem** (16 px = 1rem, la racine garde la taille du navigateur). Seules les bordures et contours d'1–2 px restent en px.
- **Typographie** : titres en Fraunces (`--font-title`), texte en Atkinson Hyperlegible (`--font-body`), corps à 0.9375rem sur mobile et 1.0625rem sur desktop, champs à 1rem minimum (sinon iOS zoome).

## Arborescence

```
src/app/
  core/
    supabase/       client et types de la base
    ingredients/    types d'ingrédients, ingrédients, regroupement par type
    recipes/        recettes, commentaires, calcul des quantités
    shopping-list/  liste de courses et son calcul par rayon
  features/
    recipes/        liste, détail, formulaire (création + modification)
    shopping-list/  page des courses
    ingredients/    gestion des types et des ingrédients
  shared/
    rich-text-editor/  éditeur de texte riche (Tiptap), compatible `[formField]`
    rich-text/         liens cliquables à l'affichage (`linkifyRichText`)
```

## Git

Les idées pour la suite de l'app sont dans `docs/idees.md` : une idée nouvelle va dans « À faire », une idée faite passe dans « Déjà fait » avec sa date.

Le projet est modifié depuis deux PC, parfois en même temps : au début de chaque session, suivre la skill `synchro-pc` (`.claude/skills/synchro-pc/SKILL.md`) : fetch/pull, puis les actions laissées par l'autre PC. Refaire un fetch/pull avant chaque commit et chaque push.

Conventional Commits en français, minuscules, sans point final (< 72 caractères). Les hooks Husky lancent Prettier, `tsc` et commitlint.

## Commandes

```bash
npm start                  # http://localhost:4200
npm test                   # Vitest en mode watch
npm run test:ci            # Vitest une seule fois
npm run build:github-pages # build avec le base-href du repo
```
