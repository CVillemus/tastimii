import { describe, expect, it } from 'vitest';
import { buildFamilyTree, findAisleFamily, formatFamilyPath } from './ingredient-family-tree';
import { Ingredient, IngredientFamily, IngredientFamilyTreeEntry } from './ingredient.model';

const meatFamily: IngredientFamily = { id: 'viande', name: 'Viande', parentFamilyId: null };
const chickenFamily: IngredientFamily = { id: 'poulet', name: 'Poulet', parentFamilyId: 'viande' };
const dairyFamily: IngredientFamily = { id: 'cremerie', name: 'Crèmerie', parentFamilyId: null };
const families: IngredientFamily[] = [chickenFamily, meatFamily, dairyFamily];
const familiesById: Map<string, IngredientFamily> = new Map(
  families.map((family: IngredientFamily) => [family.id, family]),
);

describe('arbre des familles', () => {
  it("donne le rayon d'une sous-famille", () => {
    expect(findAisleFamily('poulet', familiesById)).toEqual(meatFamily);
  });

  it("écrit le chemin complet d'une famille", () => {
    expect(formatFamilyPath('poulet', familiesById)).toBe('Viande › Poulet');
  });

  it('range les familles parent puis enfants, triées par nom', () => {
    const chickenThighs: Ingredient = {
      id: 'cuisses',
      name: 'Cuisses de poulet',
      familyId: 'poulet',
      defaultUnit: '',
    };
    const familyTree: IngredientFamilyTreeEntry[] = buildFamilyTree(families, [chickenThighs]);

    expect(
      familyTree.map((entry: IngredientFamilyTreeEntry) => [entry.family.name, entry.depth]),
    ).toEqual([
      ['Crèmerie', 0],
      ['Viande', 0],
      ['Poulet', 1],
    ]);
    expect(familyTree[2].ingredients).toEqual([chickenThighs]);
  });

  it('ne boucle pas sur un cycle', () => {
    const cyclicFamiliesById: Map<string, IngredientFamily> = new Map([
      ['a', { id: 'a', name: 'A', parentFamilyId: 'b' }],
      ['b', { id: 'b', name: 'B', parentFamilyId: 'a' }],
    ]);
    expect(formatFamilyPath('a', cyclicFamiliesById)).toBe('B › A');
  });
});
