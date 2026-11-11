import { describe, expect, it } from 'vitest';
import { computeResizedPhotoDimensions, PhotoDimensions } from './resize-recipe-photo';

describe('computeResizedPhotoDimensions', () => {
  it('réduit une photo en paysage en gardant ses proportions', () => {
    const resizedDimensions: PhotoDimensions = computeResizedPhotoDimensions(
      { width: 4032, height: 3024 },
      1600,
    );
    expect(resizedDimensions).toEqual({ width: 1600, height: 1200 });
  });

  it('réduit une photo en portrait par sa hauteur', () => {
    const resizedDimensions: PhotoDimensions = computeResizedPhotoDimensions(
      { width: 3024, height: 4032 },
      1600,
    );
    expect(resizedDimensions).toEqual({ width: 1200, height: 1600 });
  });

  it("n'agrandit pas une photo déjà petite", () => {
    const resizedDimensions: PhotoDimensions = computeResizedPhotoDimensions(
      { width: 800, height: 600 },
      1600,
    );
    expect(resizedDimensions).toEqual({ width: 800, height: 600 });
  });
});
