---
name: synchro-pc
description: Synchronise ce PC avec GitHub et exécute les actions laissées par l'autre PC. À utiliser au début de chaque session de travail sur Tastimii, ou quand l'utilisateur dit « synchronise », « pull », « je reviens sur ce PC » ou « actions de l'autre PC ».
---

# Synchro entre les deux PC

L'utilisateur travaille sur Tastimii depuis deux PC, parfois en même temps. Cette skill garde les deux
machines alignées et liste ce qu'un PC doit faire après le travail fait sur l'autre.

Toujours parler en français à l'utilisateur.

## À chaque début de session

1. `git fetch` puis `git status -sb`.
   - Des modifications locales non commitées : les montrer à l'utilisateur et lui demander quoi en
     faire avant de puller. Ne jamais les écraser.
   - En retard sur `origin/main` : `git pull` (merge, pas de rebase).
2. Si `package.json` ou `package-lock.json` a changé dans ce qui vient d'être tiré :
   `npm ci` (jamais `npm install`, pour ne pas modifier le lockfile).
3. Lire la section « Actions en attente » ci-dessous et faire celles qui concernent ce PC.
4. Une fois une action faite, la retirer de la liste, puis committer et pousser ce fichier
   (`chore: actions de synchro faites sur <PC>`), pour que l'autre PC ne la refasse pas.

Avant chaque commit et chaque push : refaire `git fetch` / `git pull`.

## Laisser une action pour l'autre PC

Quand un travail sur un PC demande une action sur l'autre (nouvelle dépendance, variable
d'environnement, outil à installer, migration Supabase à lancer…), l'ajouter ci-dessous avec la date,
le PC d'origine et le commit concerné, puis committer et pousser.

## Actions en attente

### Depuis le PC Windows où le projet est dans `C:\Users\marin\Documents\Tastimii`, le 11/11/2026, commit `36a0bb8`

À faire sur l'autre PC :

- [ ] `git pull` pour récupérer la nouvelle mise en page desktop (colonnes, cartes) et le fond blanc
      cassé. Pas de changement de dépendances : pas besoin de `npm ci`.
- [ ] Vérifier que `CLAUDE.md` a bien été mis à jour par le pull : la ligne « Design » parle de
      « fond blanc cassé », et une ligne « Desktop ≠ mobile agrandi » existe. Si une modification
      locale de `CLAUDE.md` entre en conflit, garder les deux contenus.

Rien d'autre : pas de migration Supabase, pas de nouvelle variable, pas d'outil à installer.

### Depuis le même PC, le 11/11/2026, commit `030c7fa`

- [ ] `git pull` : les ingrédients pointent maintenant directement vers leur type (plus de
      sous-familles). Pas de changement de dépendances : pas besoin de `npm ci`.
- [ ] **Ne pas relancer** `supabase/migrations/005_types_ingredients_sans_sous_familles.sql` : il a
      déjà été lancé sur la base Supabase (partagée par les deux PC). Le relancer échouerait sur la
      contrainte `ingredient_family_sans_parent`, qui existe déjà.

### Depuis le même PC, le 11/11/2026 : « souvent à la maison », unités g/ml, glisser-déposer, liens

- [ ] `git pull`, puis **`npm ci`** : nouvelle dépendance `@angular/cdk` (glisser-déposer des
      ingrédients). Sans `npm ci`, l'app ne compile pas.
- [ ] **Ne pas relancer** `supabase/migrations/006_souvent_a_la_maison_et_unites_de_base.sql` : il est
      lancé une seule fois sur la base Supabase partagée (le relancer échouerait sur la colonne
      `is_usually_at_home`, qui existe déjà, et multiplierait de nouveau les quantités converties).

### À faire un jour (sur n'importe quel PC, pas urgent)

- [ ] Dans `.github/workflows/deploy-github-pages.yml`, mettre à jour `actions/upload-pages-artifact`
      et `actions/deploy-pages` vers des versions qui tournent sur Node 24 : GitHub signale que leur
      version actuelle cible Node 20, qui est déprécié.
