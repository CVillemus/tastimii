# Journal des changements

Ce qui change dans Tastimii, du plus récent au plus ancien, écrit pour Corentin et Marine (ce qu'on
voit dans l'app), pas pour le code. Chaque mise en ligne sur `main` ajoute ses lignes ici, dans le
même commit.

- **Ajouts** : ce qui est nouveau.
- **Changements** : ce qui marche ou s'affiche autrement.
- **Corrections** : ce qui était cassé.
- **Base de données** : les scripts Supabase à lancer (une seule fois, sur la base partagée).

## À venir

Rien pour l'instant.

## 13/11/2026

### Ajouts

- **Squelettes de chargement** : pendant un chargement, des formes grises prennent la place du
  contenu à venir, sur toutes les pages. La page ne saute plus quand les données arrivent.
- **Fondu entre les pages** : la page qui part s'efface pendant que la nouvelle apparaît.
- **Écran toujours allumé sur la fiche recette** : le téléphone ne se met plus en veille pendant
  qu'on cuisine (iOS 16.4 et plus).
- **Bloc « À vérifier avant de partir » repliable**, avec le nombre d'ingrédients ; le téléphone
  retient s'il est replié.
- **Crayon « Éditer »** : au survol, le crayon de la fiche recette s'étend et affiche « Éditer ».

### Changements

- **Cases à cocher** redessinées : elles se remplissent en terracotta, la coche arrive avec un petit
  rebond. Les lignes cochées de la liste de courses passent en italique, le trait arrive en fondu.
- **Bloc « À vérifier avant de partir »** : carte blanche avec un en-tête teinté, plus lisible.
- **Bouton panier et compteur de parts** sur les photos : halo blanc, ombre et léger voile sur la
  photo, pour qu'ils se voient sur toutes les photos.
- **Listes déroulantes** : la flèche n'est plus collée au bord.
- **Recettes** : le bouton s'appelle « Ajouter une recette ».
- **Ingrédients** : plus de nombre d'ingrédients dans l'en-tête des types ; la maison « souvent à la
  maison » est devant le nom ; les icônes de l'en-tête et des lignes sont alignées.

## 12/11/2026

### Ajouts

- **Ajouter aux courses depuis les vignettes** : un bouton panier sur chaque recette de la liste ;
  une fois au menu, la vignette devient un compteur « − ✓ 2 parts + ».
- **Quatre étapes proposées** pour chaque nouvelle recette (Le calme avant la tempête, Le coup de
  feu, Lâcher prise, Le bouquet final), modifiables et supprimables.
- **Glisser-déposer des étapes** dans le formulaire.
- **Origine de la recette** (lien, livre, personne), affichée à côté de la durée et des parts.
- **Emoji sur les types d'ingrédients** (🥩 Viandes…), aussi sur les rayons de la liste de courses.

### Changements

- **Unités abrégées** : nb, cs, cc ; les litres s'écrivent L, cL, mL.
- **Fiche recette épurée** : tout se modifie depuis le formulaire (crayon en haut à droite), photo
  plus discrète.
- La description devient **« Astuces et variantes »**.

### Base de données

- `007_unites_abregees_cs_cc_ml.sql` : renomme les unités déjà enregistrées.
- `008_origine_des_recettes.sql` : ajoute l'origine des recettes.
- `009_emoji_des_types.sql` : ajoute l'emoji des types (et le sort des noms déjà tapés).

## 11/11/2026

### Ajouts

- **Photo de la recette**, réduite avant l'envoi, affichée dans la liste et sur la fiche.
- **Étapes avec un titre et un texte riche** (« Étape 1 : Faire la préparation »).
- **Tags** sur les recettes (Rapide, Peu de vaisselle…) et **filtre par tags** dans la liste.
- **Description en texte riche** (gras, italique, listes) en tête de recette.
- **« Souvent à la maison »** sur les ingrédients : section « À vérifier avant de partir » dans la
  liste de courses.
- **Modifier un ingrédient** et **renommer un type** depuis la page Ingrédients.
- **Glisser-déposer des ingrédients** dans le formulaire de recette.
- **Liens cliquables** dans la description et les étapes.
- **Bouton « + » flottant** sur mobile pour ajouter une recette.

### Changements

- **Nouveau design** inspiré des sites de cuisine : fond blanc cassé, cartes, grille de recettes,
  fiche en deux colonnes (ingrédients à gauche, étapes à droite) ; pensé pour desktop, compacté sur
  mobile. Plus de thème sombre.
- **Mise en page desktop en colonnes** au lieu d'un mobile agrandi.
- **Titres plus grands et plus gras**.
- **Unités en g et mL**, affichées dans l'unité la plus lisible (1500 g → 1,5 kg) ; « nb » et
  « Aucune unité (au goût) » dans une liste de choix.
- **Ingrédients rangés directement par type** (le type est le rayon des courses), sans
  sous-familles.
- Les **commentaires** et les **notes** sont remplacés par la description.

### Base de données

- `002_description_remplace_notes_et_commentaires.sql`
- `003_photos_et_etapes_riches.sql`
- `004_tags.sql`
- `005_types_ingredients_sans_sous_familles.sql`
- `006_souvent_a_la_maison_et_unites_de_base.sql`

## 09/11/2026

### Ajouts

- **Première version de Tastimii** : carnet de recettes (ingrédients, étapes, notes, commentaires),
  liste de courses calculée selon le nombre de parts et rangée par rayon, avec cases à cocher,
  gestion des ingrédients et de leurs familles.
- Mise en ligne sur GitHub Pages, base Supabase gratuite gardée éveillée par une tâche GitHub tous
  les 3 jours.

### Base de données

- `001_schema_tastimii.sql` : création des tables.
