import { describe, expect, it } from 'vitest';
import {
  buildUnitChoices,
  COUNT_UNIT_CHOICE,
  createEmptyRecipeFormModel,
  findStarterStepLegend,
  moveArrayItem,
  NO_UNIT_CHOICE,
  toStoredQuantityAndUnit,
  toUnitChoice,
  UnitChoice,
} from './recipe-form.model';

describe('étapes proposées au départ', () => {
  it('une nouvelle recette commence avec les quatre étapes, sans texte', () => {
    expect(createEmptyRecipeFormModel().steps).toEqual([
      { title: 'Le calme avant la tempête', contentHtml: '' },
      { title: 'Le coup de feu', contentHtml: '' },
      { title: 'Lâcher prise', contentHtml: '' },
      { title: 'Le bouquet final', contentHtml: '' },
    ]);
  });

  it('donne la légende tant que le nom proposé est gardé', () => {
    expect(findStarterStepLegend('Le coup de feu')).toContain('sur le feu');
    expect(findStarterStepLegend('  lâcher prise ')).toContain('mijoter');
    expect(findStarterStepLegend('Faire la sauce')).toBeNull();
  });
});

describe("unités d'une ligne d'ingrédient", () => {
  it('propose « Nombre » et « Aucune unité » avant les unités habituelles', () => {
    expect(buildUnitChoices(['g', 'kg']).map((unitChoice: UnitChoice) => unitChoice.value)).toEqual(
      [COUNT_UNIT_CHOICE, NO_UNIT_CHOICE, 'g', 'kg'],
    );
  });

  it('relit une ligne enregistrée : une quantité sans unité est un nombre', () => {
    expect(toUnitChoice(4, '')).toBe(COUNT_UNIT_CHOICE);
    expect(toUnitChoice(null, '')).toBe(NO_UNIT_CHOICE);
    expect(toUnitChoice(200, 'g')).toBe('g');
    expect(toUnitChoice(null, 'pincée')).toBe('pincée');
    expect(toUnitChoice(250, 'ml')).toBe('mL');
    expect(toUnitChoice(2, 'c. à soupe')).toBe('cs');
  });

  it('enregistre « Nombre » comme une unité vide avec sa quantité', () => {
    expect(toStoredQuantityAndUnit(4, COUNT_UNIT_CHOICE)).toEqual({ quantity: 4, unit: '' });
  });

  it('enregistre « Aucune unité » sans quantité, même si une quantité était tapée', () => {
    expect(toStoredQuantityAndUnit(3, NO_UNIT_CHOICE)).toEqual({ quantity: null, unit: '' });
  });

  it('déplace une ligne vers le haut ou le bas, sans sortir du tableau', () => {
    expect(moveArrayItem(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
    expect(moveArrayItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveArrayItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moveArrayItem(['a', 'b', 'c'], 2, 3)).toEqual(['a', 'b', 'c']);
  });

  it('garde une unité habituelle telle quelle', () => {
    expect(toStoredQuantityAndUnit(200, 'g')).toEqual({ quantity: 200, unit: 'g' });
  });
});
