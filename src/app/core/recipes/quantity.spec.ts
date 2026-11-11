import { describe, expect, it } from 'vitest';
import {
  formatPreparationTime,
  formatQuantity,
  formatQuantityWithUnit,
  formatReadableQuantityHint,
  scaleQuantity,
} from './quantity';

describe('quantités', () => {
  it('divise par deux pour deux fois moins de parts', () => {
    expect(scaleQuantity(4, 4, 2)).toBe(2);
  });

  it('garde « au goût » quand la quantité est vide', () => {
    expect(scaleQuantity(null, 4, 8)).toBeNull();
    expect(formatQuantityWithUnit(null, '')).toBe('au goût');
  });

  it('arrondit selon la taille du nombre', () => {
    expect(formatQuantity(1 / 3)).toBe('0,33');
    expect(formatQuantity(2.55)).toBe('2,6');
    expect(formatQuantity(312.5)).toBe('313');
  });

  it("colle l'unité à la quantité", () => {
    expect(formatQuantityWithUnit(200, 'g')).toBe('200 g');
    expect(formatQuantityWithUnit(2, '')).toBe('2');
  });

  it("affiche les grammes et millilitres dans l'unité la plus lisible", () => {
    expect(formatQuantityWithUnit(1500, 'g')).toBe('1,5 kg');
    expect(formatQuantityWithUnit(999, 'g')).toBe('999 g');
    expect(formatQuantityWithUnit(1000, 'ml')).toBe('1 l');
    expect(formatQuantityWithUnit(250, 'ml')).toBe('25 cl');
    expect(formatQuantityWithUnit(15, 'ml')).toBe('1,5 cl');
    expect(formatQuantityWithUnit(5, 'ml')).toBe('5 ml');
    expect(formatQuantityWithUnit(2, 'c. à soupe')).toBe('2 c. à soupe');
  });

  it("aide la saisie quand l'unité lisible diffère", () => {
    expect(formatReadableQuantityHint(1000, 'ml')).toBe('1 l');
    expect(formatReadableQuantityHint(500, 'g')).toBeNull();
    expect(formatReadableQuantityHint(null, 'ml')).toBeNull();
    expect(formatReadableQuantityHint(4, '')).toBeNull();
  });

  it('écrit les durées en heures et minutes', () => {
    expect(formatPreparationTime(45)).toBe('45 min');
    expect(formatPreparationTime(70)).toBe('1 h 10');
    expect(formatPreparationTime(120)).toBe('2 h');
  });
});
