import { describe, expect, it } from 'vitest';
import { collectUsedTags, filterBySelectedTags, RecipeTag } from './tag.model';

const quickTag: RecipeTag = { id: 'rapide', name: 'Rapide' };
const fewDishesTag: RecipeTag = { id: 'vaisselle', name: 'Peu de vaisselle' };
const aheadTag: RecipeTag = { id: 'avance', name: 'Préparation en avance' };

type TaggedRecipe = { title: string; tags: RecipeTag[] };

const recipes: TaggedRecipe[] = [
  { title: 'Pâtes au pesto', tags: [quickTag, fewDishesTag] },
  { title: 'Omelette', tags: [quickTag] },
  { title: 'Lasagnes', tags: [aheadTag] },
  { title: 'Soupe', tags: [] },
];

function titlesOf(taggedRecipes: TaggedRecipe[]): string[] {
  return taggedRecipes.map((taggedRecipe: TaggedRecipe) => taggedRecipe.title);
}

describe('filterBySelectedTags', () => {
  it('garde toutes les recettes sans tag choisi', () => {
    expect(titlesOf(filterBySelectedTags(recipes, new Set()))).toEqual([
      'Pâtes au pesto',
      'Omelette',
      'Lasagnes',
      'Soupe',
    ]);
  });

  it('garde les recettes qui ont le tag choisi', () => {
    expect(titlesOf(filterBySelectedTags(recipes, new Set(['rapide'])))).toEqual([
      'Pâtes au pesto',
      'Omelette',
    ]);
  });

  it('avec plusieurs tags, garde les recettes qui les ont tous', () => {
    expect(titlesOf(filterBySelectedTags(recipes, new Set(['rapide', 'vaisselle'])))).toEqual([
      'Pâtes au pesto',
    ]);
  });
});

describe('collectUsedTags', () => {
  it('liste une seule fois chaque tag utilisé, par ordre alphabétique', () => {
    expect(collectUsedTags(recipes).map((tag: RecipeTag) => tag.name)).toEqual([
      'Peu de vaisselle',
      'Préparation en avance',
      'Rapide',
    ]);
  });
});
