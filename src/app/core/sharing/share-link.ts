/** Ce qui s'est passé quand on a voulu partager un lien. */
export type ShareLinkOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Lien complet d'une recette, à partir de l'adresse de base de l'app (`document.baseURI`) :
 * `http://localhost:4300/recettes/<id>` en local, `https://cvillemus.github.io/tastimii/recettes/<id>`
 * en ligne. Ouvert directement, ce lien affiche la fiche (GitHub Pages renvoie vers l'app).
 */
export function buildRecipeShareUrl(recipeId: string, baseUri: string): string {
  return new URL(`recettes/${encodeURIComponent(recipeId)}`, baseUri).href;
}

/**
 * Partage un lien :
 * - sur téléphone (écran tactile), avec la feuille de partage du système (Messages, WhatsApp…) ;
 * - sinon, en copiant le lien dans le presse-papiers.
 */
export async function shareLink(
  sharedLink: { title: string; url: string },
  browserWindow: Window,
): Promise<ShareLinkOutcome> {
  const browserNavigator: Navigator = browserWindow.navigator;
  const isTouchDevice: boolean = browserWindow.matchMedia('(pointer: coarse)').matches;
  const canUseShareSheet: boolean =
    isTouchDevice &&
    typeof browserNavigator.share === 'function' &&
    (browserNavigator.canShare?.(sharedLink) ?? true);

  if (canUseShareSheet) {
    try {
      await browserNavigator.share(sharedLink);
      return 'shared';
    } catch (shareError: unknown) {
      // L'utilisateur a fermé la feuille de partage : ce n'est pas une erreur.
      if (shareError instanceof DOMException && shareError.name === 'AbortError') {
        return 'cancelled';
      }
      // Partage refusé : on se rabat sur la copie du lien.
    }
  }

  try {
    await browserNavigator.clipboard.writeText(sharedLink.url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
