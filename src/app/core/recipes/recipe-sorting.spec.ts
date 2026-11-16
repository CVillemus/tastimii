import { describe, expect, it } from 'vitest';
import { sortRecipes } from './recipe-sorting';

type TestRecipe = { title: string; createdAt: string };

const recipes: TestRecipe[] = [
  { title: 'Lentilles saucisse', createdAt: '2026-11-12T10:00:00Z' },
  { title: 'Œuf cocotte', createdAt: '2026-11-15T09:00:00Z' },
  { title: 'butter chicken', createdAt: '2026-11-10T08:00:00Z' },
  { title: 'Crumble', createdAt: '2026-11-15T09:00:00Z' },
];

function titlesOf(sortedRecipes: TestRecipe[]): string[] {
  return sortedRecipes.map((recipe: TestRecipe) => recipe.title);
}

describe('sortRecipes', () => {
  it('trie de A à Z sans tenir compte des majuscules ni des accents', () => {
    expect(titlesOf(sortRecipes(recipes, 'alphabetical'))).toEqual([
      'butter chicken',
      'Crumble',
      'Lentilles saucisse',
      'Œuf cocotte',
    ]);
  });

  it("met les recettes ajoutées le plus récemment d'abord, par titre à date égale", () => {
    expect(titlesOf(sortRecipes(recipes, 'newest'))).toEqual([
      'Crumble',
      'Œuf cocotte',
      'Lentilles saucisse',
      'butter chicken',
    ]);
  });

  it('ne modifie pas la liste reçue', () => {
    sortRecipes(recipes, 'newest');
    expect(titlesOf(recipes)[0]).toBe('Lentilles saucisse');
  });
});
