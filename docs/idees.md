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
- [ ] **Éviter les doublons quand il y aura beaucoup d'ingrédients** : barre de recherche sur la page,
      et/ou avertissement à la création quand un nom proche existe déjà (« Lentille verte » vs
      « Lentilles vertes » : comparer sans accents, sans pluriel, avec une distance de mots).

### Liste de courses

- [ ] Bien pour l'instant. **À revoir quand il y aura plusieurs rayons et recettes** (lisibilité,
      ordre des rayons).

### Recettes

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
- [ ] **Harmoniser les arrondis des formes** pour que tout soit cohérent (et satisfaisant à l'œil).
      Aujourd'hui trois arrondis cohabitent : 0,5 rem pour les champs et boutons
      (`--radius-control`), 0,75 rem pour les cartes (`--radius-card`), et des pilules / ronds
      (tags, compteurs, boutons ronds). Piste : choisir une seule échelle (par ex. petit / moyen /
      pilule), l'appliquer partout via les variables de `src/styles.css`, et vérifier les cas où une
      forme est imbriquée dans une autre (l'arrondi intérieur doit être plus petit que l'extérieur).
- [ ] **Typographie des quantités** : la police du texte (Atkinson Hyperlegible) dessine le zéro
      barré (« 25Ø g »), pas joli dans les quantités. Piste : afficher les nombres (quantités, parts,
      durées) avec une autre police ou une variante de chiffres sans zéro barré (chiffres de
      Fraunces, ou une police système), en chiffres alignés pour que les colonnes restent nettes.

### Autres fonctionnalités

- [ ] **Notation des recettes** : étoiles, smileys ou simple coup de cœur. Par profil (Corentin /
      Marine) ? Il faudrait alors choisir « qui je suis » sur l'appareil (sans vrai compte).
- [ ] **« Le coup de cœur de X »** (X = une personne : Corentin, Marine, un ami…) : marquer qu'une
      recette est le coup de cœur de quelqu'un, affiché sur la vignette et la fiche (« ❤️ Le coup de
      cœur de Marine »), et pouvoir filtrer dessus. Proche de la notation ci-dessus : à concevoir
      ensemble (une liste de personnes, sans vrais comptes).
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
- [x] **Ajouter aux courses depuis les vignettes** : bouton panier en haut à droite de la photo
      (à droite de la ligne sur mobile), qui ajoute la recette avec ses parts de base ; la vignette
      devient alors un compteur « − ✓ 2 parts + » (sous 1 part, la recette sort du menu), avec un
      liseré de couleur sur desktop. On voit ainsi d'un coup d'œil les recettes au menu. Le bouton
      « Ajouter aux courses » de la fiche recette est gardé.
- [x] **Fiche recette plus épurée** : plus de modification de la description sur la fiche ; un
      crayon en haut à droite de l'en-tête ouvre le formulaire, où tout se modifie. Photo moins
      haute et moins large.
- [x] **Description → « Astuces et variantes »** (tips, four ou air fryer, variantes…).
- [x] **Origine de la recette** : champ libre dans le formulaire (lien, livre, personne), affiché
      « Origine : … » à côté de la durée et des parts ; une adresse web devient un lien au nom du
      site (« instagram.com ») (migration 008).
- [x] **Emoji sur les types** (🥩 Viandes, 🧀 Œufs et produits laitiers…) dans une case à part,
      devant le nom, sur la page Ingrédients et sur les rayons de la liste de courses ; le tri se
      fait sur le nom (migration 009, qui a sorti des noms les emojis déjà tapés).

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
