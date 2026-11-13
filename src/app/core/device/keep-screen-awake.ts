import { DestroyRef, DOCUMENT, inject } from '@angular/core';

/**
 * Garde l'écran allumé tant que le composant qui l'appelle est affiché (API Screen Wake Lock).
 * Pratique pour suivre une recette en cuisinant, les mains occupées.
 *
 * - Le navigateur relâche l'écran quand la page passe en arrière-plan (autre appli, écran
 *   verrouillé) : on le redemande quand elle redevient visible.
 * - Quand le composant disparaît (on quitte la fiche), l'écran se remet à s'éteindre normalement.
 * - Navigateur sans cette API, ou demande refusée (batterie faible…) : rien ne change.
 *
 * À appeler dans un contexte d'injection (constructeur ou initialisation d'un champ).
 */
export function keepScreenAwake(): void {
  const destroyRef: DestroyRef = inject(DestroyRef);
  const documentRef: Document = inject(DOCUMENT);
  const browserNavigator: Navigator | undefined = documentRef.defaultView?.navigator;
  if (browserNavigator === undefined || !('wakeLock' in browserNavigator)) {
    return;
  }

  let wakeLockSentinel: WakeLockSentinel | null = null;
  let isComponentAlive: boolean = true;

  const requestScreenWakeLock = async (): Promise<void> => {
    if (
      !isComponentAlive ||
      wakeLockSentinel !== null ||
      documentRef.visibilityState !== 'visible'
    ) {
      return;
    }
    try {
      const grantedSentinel: WakeLockSentinel = await browserNavigator.wakeLock.request('screen');
      // Le composant a pu disparaître pendant la demande : on rend l'écran tout de suite.
      if (!isComponentAlive) {
        await grantedSentinel.release();
        return;
      }
      wakeLockSentinel = grantedSentinel;
      grantedSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
    } catch {
      // Demande refusée (batterie faible, réglage du navigateur…) : l'écran s'éteindra normalement.
    }
  };

  const onVisibilityChange = (): void => {
    void requestScreenWakeLock();
  };

  documentRef.addEventListener('visibilitychange', onVisibilityChange);
  void requestScreenWakeLock();

  destroyRef.onDestroy(() => {
    isComponentAlive = false;
    documentRef.removeEventListener('visibilitychange', onVisibilityChange);
    void wakeLockSentinel?.release();
    wakeLockSentinel = null;
  });
}
