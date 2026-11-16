import { describe, expect, it } from 'vitest';
import {
  chooseRecipeSort,
  DEFAULT_RECIPE_SORT,
  parseRecipeSort,
  RecipeSort,
  serializeRecipeSort,
  sortRecipes,
} from './recipe-sorting';

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
  it('trie par nom de A à Z, sans tenir compte des majuscules ni des accents', () => {
    expect(titlesOf(sortRecipes(recipes, { field: 'title', direction: 'ascending' }))).toEqual([
      'butter chicken',
      'Crumble',
      'Lentilles saucisse',
      'Œuf cocotte',
    ]);
  });

  it('trie par nom de Z à A quand le sens est inversé', () => {
    expect(titlesOf(sortRecipes(recipes, { field: 'title', direction: 'descending' }))).toEqual([
      'Œuf cocotte',
      'Lentilles saucisse',
      'Crumble',
      'butter chicken',
    ]);
  });

  it("par date : les plus récentes d'abord, ou les plus anciennes ; à date égale, par nom", () => {
    expect(titlesOf(sortRecipes(recipes, { field: 'createdAt', direction: 'descending' }))).toEqual(
      ['Crumble', 'Œuf cocotte', 'Lentilles saucisse', 'butter chicken'],
    );
    expect(titlesOf(sortRecipes(recipes, { field: 'createdAt', direction: 'ascending' }))).toEqual([
      'butter chicken',
      'Lentilles saucisse',
      'Crumble',
      'Œuf cocotte',
    ]);
  });

  it('ne modifie pas la liste reçue', () => {
    sortRecipes(recipes, { field: 'createdAt', direction: 'descending' });
    expect(titlesOf(recipes)[0]).toBe('Lentilles saucisse');
  });
});

describe('chooseRecipeSort', () => {
  it('inverse le sens quand on reclique sur le critère actif', () => {
    expect(chooseRecipeSort(DEFAULT_RECIPE_SORT, 'title')).toEqual({
      field: 'title',
      direction: 'descending',
    });
  });

  it('choisit un autre critère dans son sens habituel (date : plus récentes d’abord)', () => {
    expect(chooseRecipeSort(DEFAULT_RECIPE_SORT, 'createdAt')).toEqual({
      field: 'createdAt',
      direction: 'descending',
    });
  });
});

describe('parseRecipeSort', () => {
  it('relit un tri enregistré', () => {
    const recipeSort: RecipeSort = { field: 'createdAt', direction: 'ascending' };
    expect(parseRecipeSort(serializeRecipeSort(recipeSort))).toEqual(recipeSort);
  });

  it('revient au tri par défaut si la valeur est inconnue ou absente', () => {
    expect(parseRecipeSort('newest')).toEqual(DEFAULT_RECIPE_SORT);
    expect(parseRecipeSort(null)).toEqual(DEFAULT_RECIPE_SORT);
  });
});
