import { RecipeTag } from '../tags/tag.model';

/** Recette telle qu'affichée dans la liste. */
export type RecipeSummary = {
  id: string;
  title: string;
  baseServings: number;
  preparationMinutes: number | null;
  /** Adresse publique de la photo, ou `null` si la recette n'en a pas. */
  photoUrl: string | null;
  /** Tags de la recette, triés par nom. */
  tags: RecipeTag[];
};

/** Une étape de préparation : un titre court (facultatif) et un texte riche (HTML). */
export type RecipeStep = {
  title: string;
  contentHtml: string;
};

/** Ingrédient d'une recette, pour son nombre de parts de base. `quantity` vide = « au goût ». */
export type RecipeIngredientLine = {
  ingredientId: string;
  ingredientName: string;
  quantity: number | null;
  unit: string;
};

/** Recette complète, pour la page de détail et le formulaire de modification. */
export type Recipe = RecipeSummary & {
  /** Chemin de la photo dans Storage, pour la remplacer ou la supprimer. */
  photoPath: string | null;
  steps: RecipeStep[];
  /** Astuces et variantes en texte riche (HTML), affichées en tête de la recette. */
  descriptionHtml: string;
  /** Origine : lien web, livre (« Saveurs »), personne… Vide = non renseignée. */
  origin: string;
  ingredientLines: RecipeIngredientLine[];
};

/** Ce qu'on envoie à la base pour créer ou modifier une recette. */
export type RecipeDraft = {
  title: string;
  baseServings: number;
  preparationMinutes: number | null;
  steps: RecipeStep[];
  descriptionHtml: string;
  origin: string;
  ingredientLines: RecipeDraftIngredientLine[];
  tagIds: string[];
};

/** Origine affichable : un lien (adresse web) ou un texte (livre, personne…). */
export type RecipeOrigin =
  { kind: 'link'; url: string; label: string } | { kind: 'text'; text: string };

/**
 * Lit l'origine saisie : « https://www.instagram.com/… » devient un lien (libellé = le site,
 * « instagram.com ») ; tout le reste (« Saveurs », « Mamie ») reste du texte. `null` si vide.
 */
export function parseRecipeOrigin(origin: string): RecipeOrigin | null {
  const trimmedOrigin: string = origin.trim();
  if (trimmedOrigin.length === 0) {
    return null;
  }
  if (/^https?:\/\//i.test(trimmedOrigin)) {
    try {
      const originUrl: URL = new URL(trimmedOrigin);
      return {
        kind: 'link',
        url: originUrl.href,
        label: originUrl.hostname.replace(/^www\./, ''),
      };
    } catch {
      return { kind: 'text', text: trimmedOrigin };
    }
  }
  return { kind: 'text', text: trimmedOrigin };
}

export type RecipeDraftIngredientLine = {
  ingredientId: string;
  quantity: number | null;
  unit: string;
};
