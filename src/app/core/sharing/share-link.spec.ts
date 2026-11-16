import { describe, expect, it } from 'vitest';
import { buildRecipeShareUrl } from './share-link';

describe('buildRecipeShareUrl', () => {
  it('construit le lien en local, à la racine du site', () => {
    expect(buildRecipeShareUrl('b23c7a20', 'http://localhost:4300/')).toBe(
      'http://localhost:4300/recettes/b23c7a20',
    );
  });

  it('garde le dossier du site en ligne (GitHub Pages)', () => {
    expect(buildRecipeShareUrl('b23c7a20', 'https://cvillemus.github.io/tastimii/')).toBe(
      'https://cvillemus.github.io/tastimii/recettes/b23c7a20',
    );
  });

  it('encode un identifiant qui contiendrait des caractères spéciaux', () => {
    expect(buildRecipeShareUrl('a b/c', 'http://localhost:4300/')).toBe(
      'http://localhost:4300/recettes/a%20b%2Fc',
    );
  });
});
