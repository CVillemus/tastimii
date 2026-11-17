# Journal des changements

Ce qui change dans Tastimii, du plus récent au plus ancien, écrit pour Corentin et Marine (ce qu'on
voit dans l'app), pas pour le code. Chaque mise en ligne sur `main` ajoute ses lignes ici, dans le
même commit.

- **Ajouts** : ce qui est nouveau.
- **Changements** : ce qui marche ou s'affiche autrement.
- **Corrections** : ce qui était cassé.
- **Base de données** : les scripts Supabase à lancer (une seule fois, sur la base partagée).

## À venir

- **Fiche recette** :
  - durées avec une icône : planche et couteau pour la préparation, cocotte qui fume pour la cuisson ;
  - ingrédients dans l'ordre des livres de cuisine : « 400 g » puis « pomme de terre », quantités en colonne.
- **Typographie** : les surtitres (« Ingrédients », « Type de plat »…) et les onglets du menu passent en Fraunces, en minuscules, au lieu des capitales espacées.
- **Recherche des recettes** : une loupe dans le champ ; les textes d'exemple de tous les champs sont plus contrastés.
- **Fenêtre « Gérer les tags »** (ordinateur) : une seule barre de défilement au lieu de deux.

## 17/11/2026

### Ajouts

- **Durées de préparation et de cuisson**, facultatives, à la place d'une seule durée. La fiche
  affiche « Préparation 15 min · Cuisson 35 min » ; les vignettes et la cuisine, la durée totale.
  Les recettes existantes gardent leur durée (affichée comme avant ; à répartir au besoin dans le
  formulaire) (migration 012).
- **Formulaire de recette** :
  - sur ordinateur, même largeur que les autres pages, et barre des étapes alignée à gauche ;
  - « Suivant » ou « Enregistrer » refusé : le curseur va sur le premier champ à corriger ;
  - photo : sans photo, une grande zone « Ajouter une photo » ; avec photo, « Changer la photo »
    au survol (icône toujours visible sur téléphone).
- **Zones « Ajouter… »** (ingrédient, étape, photo) : fond blanc et pointillés plus fins.
- **Lien « ← Retour »** un peu plus grand sur ordinateur.
- **Tags sur téléphone** : « +N » est un bouton qui affiche les autres tags de la recette.
- **Page Ingrédients** : cartes des rayons plus compactes, titre plus petit.
- **Filtres des recettes** (ordinateur) dans une carte blanche, comme les ingrédients sur la fiche ; plus de filet vertical entre les colonnes, sur toutes les pages.
- **Ajouter une recette en trois étapes** : 1 Infos (titre, parts, durée, origine, photo, tags), 2 Ingrédients, 3 Préparation (étapes, puis astuces et variantes). Une barre en haut montre où on en est ; « Suivant » vérifie l'étape avant de passer à la suivante (un titre, au moins un ingrédient, au moins une étape écrite). Les boutons sont à la fin de chaque étape, sans barre fixe. Le bouton Retour du téléphone revient à l'étape précédente.
- **Brouillon** : une nouvelle recette en cours de saisie est gardée sur l'appareil (sans la photo) jusqu'à son enregistrement ; « Recommencer à zéro » pour l'oublier.
- **Modifier une recette** : les trois étapes s'ouvrent librement, « Enregistrer » est sur chacune.

### Base de données

- `supabase/migrations/012_duree_de_cuisson.sql` : colonne `cooking_minutes` (lancé le
  17/11/2026 sur la base partagée).

## 16/11/2026

### Raffinements visuels

- **Survol des boutons-icônes** (crayon, croix, maison…) : un léger voile rond et l'icône passe en terracotta.
- **Types d'ingrédients** : plus de trait en double sous le bandeau du titre.
- **Fiche recette sur téléphone** : la photo touche la barre du haut, sans marge.
- **Filtres sur téléphone** : un bouton « Filtres » (avec le nombre de tags choisis) ouvre un panneau qui monte du bas ; la liste des recettes passe en premier.
- **Cartes plus légères sur téléphone** : un seul tag par recette, puis « +N ».
- **Boutons sur les photos** en verre dépoli (liste et fiche recette) ; sur ordinateur, « ⋯ » n'apparaît qu'au survol de la carte.
- **Plus d'air** entre la colonne des filtres et les recettes (et sur les autres pages en deux colonnes), avec un filet vertical.
- **Rayons d'ingrédients plus visibles** : le titre de chaque type (Légumes, Crèmerie…) est sur un bandeau teinté.
- **Cartes harmonisées** sur tous les écrans : sans bordure, même ombre et même réaction au survol.

### Ajouts

- **Vue mosaïque ou liste** sur ordinateur : deux icônes à côté du tri, mosaïque par défaut, choix
  retenu sur l'appareil. Sur téléphone, toujours la liste.
- **Liste des recettes plus soignée** : chaque recette est une carte blanche aux coins arrondis,
  avec une photo plus grande à gauche.
- **Ajouter directement à la cuisine** : sur la fiche, sous « Ajouter aux courses », pour les
  courses faites hors de l'app ou une envie improvisée. La recette arrive en cuisine avec les parts
  choisies. Aussi depuis la liste, dans le menu « ⋯ » de chaque recette.
- **Partager une recette** : un bouton sur la fiche, à côté du crayon. Sur téléphone, il ouvre le
  partage du système (Messages, WhatsApp…) ; sur ordinateur, il copie le lien de la recette.
  Aussi depuis la liste des recettes, dans le menu « ⋯ » de chaque recette.
- **Nombre de fois cuisinée** affiché sur la fiche recette (« Cuisinée 3 fois », « Jamais
  cuisinée »).
- **Trier les recettes** : au-dessus de la liste, à côté du nombre de recettes, par nom ou par
  date d'ajout. Comme dans un tableau, une flèche ↑/↓ montre le sens et un second clic l'inverse.
  Le choix est retenu sur l'appareil.
- **Fenêtre de confirmation** aux couleurs de l'app avant une suppression définitive.

### Changements

- **Vignettes plus légères** : le sac de courses reste en direct ; « Ajouter à la cuisine » et
  « Partager » passent dans un petit menu « ⋯ ».
- **Liste des recettes** : plus de nombre de parts sur les vignettes (il se choisit au moment
  d'ajouter aux courses), seulement la durée.
- **Supprimer une recette** : le bouton quitte la fiche et passe en bas du formulaire de
  modification, avec une fenêtre de confirmation.
- **Mobile** : le lien « Retour » devient un bouton rond flottant en bas à gauche, pendant du « + ».
- **« Gérer les tags »** : seulement dans le formulaire de recette, là où on choisit et crée les
  tags, et dans une fenêtre par-dessus le formulaire : on ne quitte plus la recette en cours
  (rien n'est perdu), et les tags du formulaire se mettent à jour tout de suite.
- **Formulaire de recette** : « + Ajouter un ingrédient » et « + Ajouter une étape » prennent la
  forme d'une ligne vide en pointillés, dans la continuité de la liste.

## 15/11/2026

### Ajouts

- **Tags rangés en trois catégories** : 🍲 Type de plat (Quiche & tarte, Soupe, Salade, Pâtes, Riz,
  Gratin, Mijoté, Poêlée, Dessert, Apéro), 🌦️ Saison (Été, Hiver) et ✨ Envie (Réconfortant, Léger,
  Pour recevoir, Végétarien, Peu de vaisselle, À l'avance). Les nouveaux tags sont créés, aucune
  recette n'est taguée d'office.
- **Page « Gérer les tags »** (liens depuis la liste des recettes et le formulaire) : renommer un
  tag, changer sa catégorie, le supprimer (l'app dit de combien de recettes il sera retiré), en
  ajouter dans chaque catégorie.

### Changements

- **Formulaire de recette** : les tags sont groupés par catégorie. La saison n'accepte qu'un choix
  (cocher Hiver décoche Été) ; sans saison, la recette est de toute l'année. Un nouveau tag se crée
  avec sa catégorie.
- **Filtres de la liste des recettes** groupés par catégorie : un type de plat parmi ceux choisis
  (Pâtes ou Soupe), la saison choisie plus les recettes de toute l'année, et toutes les envies
  choisies (Végétarien et Pour recevoir). Un bouton « Retirer les filtres » remplace « Toutes ».
- **Tags sur les vignettes et la fiche** : dans l'ordre type de plat, saison, envie.
- **« Préparation en avance »** s'appelle maintenant « À l'avance ».

### Base de données

- `011_categories_de_tags.sql` : ajoute la catégorie des tags, crée les tags de départ et renomme
  « Préparation en avance ».

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
- **Page Cuisine** : sur Courses, « Courses faites » fait passer les recettes du menu en cuisine et
  vide la liste. En cuisine, « Cuisinée » valide la recette (elle est comptée), « Retirer » la
  retire sans la compter. L'onglet Cuisine n'apparaît que s'il y a des recettes à cuisiner.
- **Compteur de recettes cuisinées** : chaque recette cuisinée est enregistrée (date et parts),
  pour une fonctionnalité à venir.

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
- **Navigation desktop « éditoriale »** : le logo au centre, plus grand, et les rubriques dessous en
  petites capitales, comme la une d'un magazine. L'en-tête défile avec la page.
- **Barre d'onglets mobile** : collée en bas, coins du haut arrondis et ombre légère ;
  icônes fines (livre, panier, carotte), libellés en petites capitales, l'onglet actif en
  terracotta.
- **Courses vide** : le message est aligné sous le titre, avec une pastille panier.
- **Courses** : plus de bouton « Actualiser », la liste se recharge à chaque ouverture.
- **Fiche recette** : un peu d'air à gauche de « Éditer » au survol du crayon.
- **Onglet Cuisine** : toujours visible dans la navigation, grisé et non cliquable tant qu'il n'y a
  rien à cuisiner.
- **À vérifier avant de partir** : plus de case « à acheter », un bouton **Ajouter** qui déplace
  l'ingrédient dans la liste à acheter. Dans la liste, un petit **↩** le renvoie dans « À vérifier »
  en cas d'erreur.
- **Esprit plus distingué** :
  - un **sac de courses en toile** remplace le caddie (onglet Courses, bouton sur les recettes,
    Courses vide) ;
  - les titres de section passent en **petites capitales** (Ingrédients, Préparation, Au menu…) ;
  - les **quantités et les parts** s'écrivent avec les chiffres de Fraunces (zéro sans barre) ;
  - sur la fiche, les **étapes** sont numérotées en grand, en italique terracotta, dans la marge,
    et un **ornement ✦** sépare l'en-tête de la recette ;
  - messages plus chaleureux : « Le cabas est vide », « Tout est cuisiné, bon appétit ! » ;
  - un filet très fin autour des photos et des arrondis harmonisés partout ;
  - petites animations : le compteur de parts éclot quand on ajoute une recette aux courses, la
    toque salue chaque recette cuisinée.
- **Blocs repliables animés** : « À vérifier avant de partir » et les panneaux « Ajouter… » de la
  page Ingrédients s'ouvrent et se ferment en douceur.

### Corrections

- **Mobile** : l'éditeur de texte (Astuces et variantes, étapes) ne passe plus par-dessus la barre
  d'onglets en bas de l'écran.
- **Mobile** : le « + » du bouton « Ajouter une recette » est bien centré dans le rond.
- **Titres de page** : même espace sous la navigation sur Recettes, Courses et Ingrédients.

### Base de données

- `010_cuisine_et_recettes_cuisinees.sql` : tables de la cuisine et de l'historique, et deux
  fonctions (courses faites, recette cuisinée).

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
