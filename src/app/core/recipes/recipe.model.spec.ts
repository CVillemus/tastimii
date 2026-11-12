import { describe, expect, it } from 'vitest';
import { parseRecipeOrigin } from './recipe.model';

describe("origine d'une recette", () => {
  it('affiche une adresse web comme un lien, avec le nom du site', () => {
    expect(parseRecipeOrigin(' https://www.instagram.com/whoogys/reel/DEw1gaHosUg/ ')).toEqual({
      kind: 'link',
      url: 'https://www.instagram.com/whoogys/reel/DEw1gaHosUg/',
      label: 'instagram.com',
    });
  });

  it('garde un livre ou une personne en texte', () => {
    expect(parseRecipeOrigin('Saveurs, n° 245')).toEqual({ kind: 'text', text: 'Saveurs, n° 245' });
  });

  it('ne montre rien quand elle est vide', () => {
    expect(parseRecipeOrigin('   ')).toBeNull();
  });
});
