# Idées pour la suite de Tastimii

Liste vivante : on ajoute les idées au fil de l'eau. Quand une idée est faite, elle passe dans
« Déjà fait » (en bas), avec sa date. Rien dans « À faire » n'est encore décidé : chaque idée se
discute avant d'être développée.

Dernière mise à jour : 12/11/2026.

---

## À faire : idées de l'utilisateur

### Page Ingrédients

- [ ] **Alléger les icônes** : trop de maisons, de crayons et de croix sur chaque ligne. Pistes : ne
      les montrer qu'au survol (desktop) ou dans un menu « ⋯ » par ligne, ou une seule action
      « Modifier » qui ouvre tout (et la suppression dedans).
- [ ] **Colonne de gauche trop large** (« Ajouter un ingrédient », « Ajouter un type »). Piste :
      ajouter un ingrédient directement depuis la carte de son type (« + Ajouter » en bas de chaque
      carte, le type est alors déjà choisi), et garder « Ajouter un type » en bouton discret.
- [ ] **Emoji sur les types** pour les repérer d'un coup d'œil (🥩 Viande, 🧀 Crèmerie, 🥕 Fruits et
      légumes…), aussi dans les rayons de la liste de courses. Demande une colonne `emoji` en base.
- [ ] **Éviter les doublons quand il y aura beaucoup d'ingrédients** : barre de recherche sur la page,
      et/ou avertissement à la création quand un nom proche existe déjà (« Lentille verte » vs
      « Lentilles vertes » : comparer sans accents, sans pluriel, avec une distance de mots).

### Liste de courses

- [ ] Bien pour l'instant. **À revoir quand il y aura plusieurs rayons et recettes** (lisibilité,
      ordre des rayons).

### Recettes

- [ ] **Ajouter aux courses depuis les vignettes** de la liste des recettes, sans ouvrir la recette
      (bouton « + » en haut à droite de la photo). **En suspens** (12/11/2026) : crainte d'un
      doublon avec le bouton de la fiche recette. Questions à trancher avant de coder :
  - **Comment choisir les portions ?**
    - *Ajout direct + compteur* : un clic ajoute la recette avec ses parts de base ; la vignette
      affiche alors « Au menu » et un compteur « − 4 parts + » pour ajuster sur place (sous 1 part,
      la recette sort du menu). Le plus rapide.
    - *Petite fenêtre de choix* : le « + » ouvre une bulle « − 2 parts + » avec un bouton
      « Ajouter aux courses ». Un clic de plus, mais on choisit avant d'ajouter.
  - **Garder le bouton « Ajouter aux courses » sur la fiche ?** Oui : on y voit les quantités
    recalculées avant d'ajouter. Non : la fiche est plus épurée, l'ajout se fait seulement depuis la
    liste.
  - Va de pair avec l'idée suivante (voir ce qui est déjà au menu).
- [ ] **Voir dans la liste des recettes celles déjà au menu des courses**, avec leur nombre de parts
      (badge « Au menu · 4 parts » sur la vignette, ou un aperçu « Au menu » en haut de la liste),
      mis à jour dès qu'on ajoute ou retire une recette.
- [ ] **Fiche recette plus épurée** : retirer « Modifier la description » (et « + Ajouter une
      description », la modification en place sur la fiche) ; remplacer le bouton « Modifier la
      recette » par une icône crayon en haut à droite de la carte d'en-tête. Tout se modifie alors
      depuis le formulaire.
- [ ] **Description → « Astuces et variantes »** : renommer la section et l'orienter vers les tips
      et modifications possibles (four ou air fryer, version végétarienne…).
- [ ] **Origine de la recette** : lien web ou nom d'un livre (« Saveurs », Instagram…). Donne une idée
      de la difficulté. Champ texte libre, affiché comme lien si c'est une adresse web.
- [ ] **Photos** : la qualité dépend de la photo prise. Côté poids, pas d'inquiétude à court terme
      (voir « Réponses déjà apportées »). Piste : passer en WebP pour diviser le poids par ~2.
- [ ] **Signaler les incohérences ingrédients ↔ étapes** : un ingrédient cité dans les étapes mais
      absent de la liste (beurre, huile…), ou l'inverse. Version simple faisable : chercher le nom
      de chaque ingrédient connu dans le texte des étapes et afficher un avertissement dans le
      formulaire.

### Tags

- [ ] **Ranger les tags par catégorie** : aujourd'hui tous les tags sont au même niveau. Trois
      familles se dessinent :
  - **Type de plat** : soupe, salade, plat, dessert, apéro…
  - **Saison** : été, hiver… (« toute l'année » = aucun tag de saison, pour ne pas le cocher partout) ;
  - **Mood** : express, mijoté, complexe…

  Pistes à discuter :
  - en base, une colonne `category` sur `tag` (ou une petite table `tag_category`), reprise des
    tags existants dans une migration (« Rapide » → Mood, etc.) ;
  - dans le formulaire, les tags groupés par catégorie ; pour le type de plat, un seul choix
    (une recette est une soupe *ou* une salade) ou plusieurs ?
  - dans la liste des recettes, un filtre par catégorie (« Saison : hiver » + « Mood : express ») ;
  - « Express » pourrait être déduit de la durée (moins de 30 min) plutôt que coché à la main ;
  - la saison pourrait être proposée par défaut selon le mois en cours (« recettes d'hiver » en
    novembre).

### Partout dans l'app

- [ ] **Modale de confirmation pour les actions définitives** (supprimer une recette, un ingrédient,
      un type, vider la liste de courses). Aujourd'hui l'app utilise la fenêtre native du navigateur
      (`confirm()`), austère et différente sur chaque téléphone. Piste : un composant partagé
      `shared/confirmation-dialog` (élément `<dialog>`), aux couleurs de l'app, qui dit ce qui sera
      supprimé et ses conséquences (« Supprimer la recette « Lentilles saucisse » ? C'est
      définitif. »), avec un bouton rouge « Supprimer » et « Annuler » mis en avant.

### Autres fonctionnalités

- [ ] **Notation des recettes** : étoiles, smileys ou simple coup de cœur. Par profil (Corentin /
      Marine) ? Il faudrait alors choisir « qui je suis » sur l'appareil (sans vrai compte).
- [ ] **Compteur « cuisinée N fois »** (et date de la dernière fois) : bouton « Je l'ai cuisinée »,
      ou automatique quand la recette sort de la liste de courses.
- [ ] **Chercher par ingrédient** : les recettes avec un ingrédient (« avec du poireau ») ou sans
      (« sans champignons »). Filtres dans la liste des recettes, à côté des tags.

---

## À faire : idées proposées par Claude

- [ ] **Articles libres dans la liste de courses** : ajouter « papier toilette » ou « café » sans
      recette, rangés dans un rayon. Rapide à faire, utile dès les prochaines courses.
- [ ] **Mode cuisine** : la fiche en grand, l'écran du téléphone qui ne s'éteint pas pendant qu'on
      cuisine (API Wake Lock), les étapes qu'on coche au fur et à mesure.
- [ ] **Minuteurs dans les étapes** : « Cuire 35 minutes » devient cliquable et lance un minuteur.
- [ ] **Application installable et liste hors ligne** (PWA) : icône sur l'écran d'accueil, et la
      liste de courses reste lisible en magasin même sans réseau.
- [ ] **Menu de la semaine** : placer les recettes sur les jours, ce qui remplit la liste de courses.
- [ ] **Ordre des rayons selon ton magasin** : ranger la liste dans l'ordre où tu traverses le
      magasin (glisser-déposer des types).
- [ ] **Importer une recette depuis un lien** (site de cuisine) : pré-remplir le formulaire.
      Plus complexe (lecture de la page, voire IA).

---

## Déjà fait

### 12/11/2026

- [x] **Unités abrégées** : « nb » au lieu de « Nombre (ex. 4 diots) », **cs** / **cc** au lieu de
      « c. à soupe » / « c. à café » (migration 007 pour les unités déjà enregistrées), litres en
      majuscule **L, cL, mL** (stockage en `mL`).
- [x] **Quatre étapes proposées pour chaque nouvelle recette** : Le calme avant la tempête, Le coup
      de feu, Lâcher prise, Le bouquet final, avec une légende dans le formulaire tant que le nom
      est gardé. Modifiables, supprimables ; les recettes existantes ne changent pas.
- [x] **Glisser-déposer des étapes** dans le formulaire (poignée ⠿, au doigt ou à la souris).

### 11/11/2026

- [x] **« Souvent à la maison »** sur les ingrédients : section « À vérifier avant de partir » dans
      la liste de courses, avec la quantité par recette et une case « à acheter » (migration 006).
- [x] **Unités en g / mL** avec affichage dans l'unité la plus lisible (1500 g → 1,5 kg) et aide
      dans le formulaire (« S'affichera « 1 L » ») (migration 006).
- [x] **Unités « nb » et « Aucune unité (au goût) »** dans une liste de choix.
- [x] **Modifier un ingrédient** (nom, type, unité habituelle, souvent à la maison) et **renommer un
      type** depuis la page Ingrédients, sans supprimer ni recréer.
- [x] **Message de suppression sous l'ingrédient**, avec les recettes qui l'utilisent.
- [x] **Glisser-déposer des ingrédients** dans le formulaire de recette.
- [x] **Liens cliquables** dans la description et les étapes.
- [x] **Ingrédient → type direct** (plus de sous-familles « Cuisses de poulet → Poulet → Viande ») ;
      le type est le rayon de la liste de courses (migration 005).
- [x] **Mise en page desktop** en colonnes (au lieu d'un mobile agrandi) et **fond blanc cassé**.

---

## Réponses déjà apportées

- **Poids des photos** (11/11/2026) : l'app réduit chaque photo à 1600 px en JPEG (qualité 0,82)
  avant l'envoi : environ 250 à 400 Ko pour une photo de téléphone (la photo actuelle de
  « Lentilles saucisse » fait 18 Ko). L'offre gratuite de Supabase donne 1 Go de stockage : de
  l'ordre de 3 000 photos. Pas de problème avant longtemps.
