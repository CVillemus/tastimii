# Tastimii — Design System (édition « Journal épuré »)

Règles graphiques, typographiques et ergonomiques de Tastimii. L'objectif : prolonger l'esprit
**presse culinaire / revue papier haut de gamme** de la barre de navigation sur toute l'app, en
abandonnant les codes des tableaux de bord (cartes blanches ombrées, pilules arrondies, emojis
décoratifs).

Les valeurs ci-dessous existent en **variables CSS** dans `src/styles.css` (le projet n'utilise
pas Tailwind) : on modifie la variable, jamais une couleur en dur dans un composant.

---

## 1. Principes directeurs

1. **Pas de boîte blanche sur desktop.** Le contenu respire sur le fond papier crème ; pas de
   cartes blanches à ombre portée. *Exception mobile* : sur petit écran, une carte blanche sobre
   (filet, sans ombre) peut rester là où elle aide à repérer un bloc (fiche recette, liste).
2. **Structuration par le filet (1 px).** Comme dans un journal imprimé, l'espace est découpé
   par de fines lignes horizontales et verticales (`--color-border`, `--color-border-strong`).
3. **Contraste typographique.** Une serif à empattements contrastée pour les titres
   (*Playfair Display*), une serif de lecture pour la navigation et les notes (*Lora*), une
   linéale moderne pour l'interface et les métadonnées (*DM Sans*).
4. **Sobriété chromatique et tactile.** Encre, papier non couché, terre cuite ; un micro-grain
   papier sur le fond.

---

## 2. Fondations

### 2.1 Couleurs

| Variable CSS | Nom | Valeur | Usage |
| :--- | :--- | :--- | :--- |
| `--color-background` | Papier crème | `#f9f6f0` | Fond de toutes les pages (avec le grain). |
| `--color-surface` | Papier en-tête | `#fdfbf7` | Barre du haut, champs, badges, fenêtres. |
| `--color-surface-sunken` | Papier soutenu | `#f2ede3` | Encarts éditoriaux, survols légers. |
| `--color-ink` | Encre noire chaude | `#2c221e` | Titres, texte courant, icônes actives. |
| `--color-ink-muted` | Encre sépia | `#6e635c` | Rubriques, durées, métadonnées. |
| `--color-placeholder` | Sépia clair | `#7d7067` | Textes d'exemple des champs (contraste 4,5:1). |
| `--color-accent` | Terracotta | `#b8522e` | Logo, onglet actif, bouton principal, accents. |
| `--color-accent-hover` | Terracotta sombre | `#9e4222` | Survol du bouton principal ; titres d'étapes. |
| `--color-accent-strong` | Terracotta profond | `#7a321c` | Texte sur fond teinté (contraste AAA). |
| `--color-border` | Filet doux | `#e2d9ce` | Séparateurs standards. |
| `--color-border-strong` | Filet soutenu | `#c8bcae` | Puces de filtre, champs, boutons secondaires. |

### 2.2 Grain papier

Bruit fractal SVG très léger (opacité 0,032) en image de fond du `<body>` uniquement : jamais
sur les champs, fenêtres ou badges (ils gardent un fond uni).

### 2.3 Typographie

| Variable | Police | Rôle |
| :--- | :--- | :--- |
| `--font-title` | Playfair Display | Logo, titres de page, de recette, de section. |
| `--font-serif-body` | Lora | Onglets de navigation, notes en italique. |
| `--font-body` | DM Sans | Texte, interface, filtres, métadonnées. |

| Rôle | Police | Desktop / mobile | Graisse | Particularités |
| :--- | :--- | :--- | :--- | :--- |
| Logo | Playfair | 34 px / 20 px | 600 | Mobile : barre du haut compacte. |
| Titre de page (`h1`) | Playfair | 44 px / 36 px | 600 | |
| Titre de recette | Playfair | 21 px / 18 px | 600 | |
| Navigation | Lora | 15 px / 12 px | 400 | Mobile : sous les icônes. |
| Rubrique (kicker) | DM Sans | 11 px | 500 | Capitales, espacement 0,18 em. |
| Titre de groupe de filtres | DM Sans | 11 px | 600 | Capitales, espacement 0,16 em. |
| Texte courant | DM Sans | 17 px / 15 px | 400 | Plus grand que 14 px : on lit les recettes en cuisinant. |
| Tags, métadonnées | DM Sans | 14 px / 13 px | 400 | Tags reliés par des points médians (·). |

### 2.4 Arrondis et ombres

- **Photos, bouton principal, badges** : 3 px (`--radius-control`).
- **Puces, petits contrôles, boutons secondaires** : 2 px (`--radius-small`).
- **Ombres** : aucune sur les contenus. Seuls les éléments flottants (toast, fenêtres, badges
  sur photo) ont une ombre légère ou un flou d'arrière-plan.

### 2.5 États

- **Focus clavier** : contour terracotta visible (`:focus-visible`), jamais supprimé.
- **Survol** : bordure et texte terracotta pour les contrôles secondaires ; terracotta sombre pour
  le bouton principal.
- **Animations** : courtes (0,15 à 0,4 s) et coupées si `prefers-reduced-motion`.

---

## 3. Mise en page

- **Largeur maximale** : 72 rem (1 152 px), centrée, marges 12 px (mobile) / 32 px (desktop).
- **En-tête de page** :
  1. rubrique en petites capitales (`LE CARNET CULINAIRE • COLLECTION MAISON`) ;
  2. titre `h1` à gauche, action principale alignée en bas à droite ;
  3. filet horizontal sous l'ensemble.
- **Deux colonnes (desktop)** : colonne d'index à gauche (filtres, ingrédients), séparée de la
  colonne principale par un filet vertical.

---

## 4. Composants

### 4.1 Boutons

- **Principal** : fond terracotta, texte crème, DM Sans 500, arrondi 3 px ; survol terracotta
  sombre. Un seul par zone.
- **Secondaire** : fond transparent, filet soutenu, texte encre, arrondi 2 px ; survol bordure et
  texte terracotta.
- **Contour terracotta** (`button--outline`) : action secondaire à mettre en avant
  (« Réinitialiser les filtres »).

### 4.2 Filtres d'index

- **Recherche** : fond transparent, simple filet bas, loupe à gauche ; filet terracotta au focus.
- **En tête de l'index** : « Filtrer l'index » en italique Lora, « Tout effacer » en terracotta.
- **Puces** : repos = filet soutenu, fond transparent ; actif = fond et filet terracotta, texte
  blanc. Arrondi 2 px, pas d'emoji dans les titres de groupe.

### 4.3 Carte recette (mosaïque)

- **Conteneur** transparent, sans fond ni bordure.
- **Photo** 4:3, arrondi 3 px, léger zoom (1,03) au survol.
- **Badges sur la photo** (sac, « ⋯ ») : carrés de 32 px, fond crème translucide flouté, filet
  très fin ; « ⋯ » n'apparaît qu'au survol.
- **Pied** : titre Playfair (terracotta au survol), durées avec icônes (couteau, cocotte), filet,
  tags en texte reliés par des points médians.

### 4.4 Liste (vue liste et page Courses)

- **Lignes** séparées par des filets, vignette 64 px, bouton « Cabas » à droite.
- **Case à cocher** : carré de 18 px aux angles droits, filet 1,5 px ; cochée = fond terracotta,
  coche crème, texte barré en sépia clair. La zone cliquable reste toute la ligne (doigt).

### 4.5 États vides et messages

- **État vide** : pas de carte, contenu centré entre deux filets, icône au trait fin terracotta,
  titre Playfair, phrase d'aide, action.
- **Toast** : fond encre, texte crème, pastille terracotta à gauche.

---

## 5. Écarts assumés par rapport à la proposition initiale

- **Pas de configuration Tailwind** : le projet utilise des variables CSS ; les noms existants
  (`--color-accent`…) sont gardés pour ne pas réécrire tous les composants.
- **Texte courant à 15/17 px** (et non 14 px) : lisibilité en cuisine, sur téléphone.
- **Emojis des types d'ingrédients gardés** : c'est une donnée choisie par l'utilisateur
  (migration 009). Ils disparaissent seulement des titres de filtres.
- **Mobile** : la barre d'onglets en bas et les cartes sobres restent, là où elles aident.
