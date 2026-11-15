import { describe, expect, it } from 'vitest';
import {
  collectUsedTags,
  filterByTagSelection,
  groupTagsByCategory,
  RecipeTag,
  sortTagsByCategory,
  TagCategoryGroup,
  toggleRecipeTag,
} from './tag.model';

const pastaTag: RecipeTag = { id: 'pates', name: 'Pâtes', category: 'type_de_plat' };
const soupTag: RecipeTag = { id: 'soupe', name: 'Soupe', category: 'type_de_plat' };
const summerTag: RecipeTag = { id: 'ete', name: 'Été', category: 'saison' };
const winterTag: RecipeTag = { id: 'hiver', name: 'Hiver', category: 'saison' };
const veggieTag: RecipeTag = { id: 'vege', name: 'Végétarien', category: 'envie' };
const guestsTag: RecipeTag = { id: 'recevoir', name: 'Pour recevoir', category: 'envie' };
const allTags: RecipeTag[] = [pastaTag, soupTag, summerTag, winterTag, veggieTag, guestsTag];

type TaggedRecipe = { title: string; tags: RecipeTag[] };

const recipes: TaggedRecipe[] = [
  { title: 'Pâtes au pesto', tags: [pastaTag, summerTag, veggieTag, guestsTag] },
  { title: 'Soupe de lasagnes', tags: [soupTag, pastaTag, winterTag] },
  { title: 'Velouté', tags: [soupTag, veggieTag] },
  { title: 'Gratin', tags: [winterTag, guestsTag] },
];

function titlesOf(taggedRecipes: TaggedRecipe[]): string[] {
  return taggedRecipes.map((taggedRecipe: TaggedRecipe) => taggedRecipe.title);
}

describe('catégories de tags', () => {
  it('range les tags par catégorie, dans l’ordre type de plat, saison, envie', () => {
    expect(
      groupTagsByCategory([guestsTag, winterTag, soupTag, pastaTag]).map(
        (tagCategoryGroup: TagCategoryGroup) => [
          tagCategoryGroup.definition.label,
          tagCategoryGroup.tags.map((tag: RecipeTag) => tag.name),
        ],
      ),
    ).toEqual([
      ['Type de plat', ['Pâtes', 'Soupe']],
      ['Saison', ['Hiver']],
      ['Envie', ['Pour recevoir']],
    ]);
  });

  it('garde les catégories vides seulement si on le demande', () => {
    expect(groupTagsByCategory([pastaTag]).length).toBe(1);
    expect(groupTagsByCategory([pastaTag], true).length).toBe(3);
  });

  it('trie les tags d’une recette par catégorie', () => {
    expect(sortTagsByCategory([guestsTag, winterTag, pastaTag]).map((tag) => tag.name)).toEqual([
      'Pâtes',
      'Hiver',
      'Pour recevoir',
    ]);
  });
});

describe('cocher un tag sur une recette', () => {
  it('ajoute ou retire un tag', () => {
    expect(toggleRecipeTag(['pates'], soupTag, allTags)).toEqual(['pates', 'soupe']);
    expect(toggleRecipeTag(['pates', 'soupe'], soupTag, allTags)).toEqual(['pates']);
  });

  it('ne garde qu’une saison : cocher Hiver décoche Été', () => {
    expect(toggleRecipeTag(['pates', 'ete'], winterTag, allTags)).toEqual(['pates', 'hiver']);
  });
});

describe('filtrer les recettes par tags', () => {
  it('garde toutes les recettes sans tag choisi', () => {
    expect(filterByTagSelection(recipes, []).length).toBe(4);
  });

  it('type de plat : l’un des types choisis', () => {
    expect(titlesOf(filterByTagSelection(recipes, [pastaTag]))).toEqual([
      'Pâtes au pesto',
      'Soupe de lasagnes',
    ]);
    expect(titlesOf(filterByTagSelection(recipes, [pastaTag, soupTag]))).toEqual([
      'Pâtes au pesto',
      'Soupe de lasagnes',
      'Velouté',
    ]);
  });

  it('saison : les recettes de la saison et celles de toute l’année', () => {
    expect(titlesOf(filterByTagSelection(recipes, [summerTag]))).toEqual([
      'Pâtes au pesto',
      'Velouté',
    ]);
  });

  it('envie : toutes les envies choisies', () => {
    expect(titlesOf(filterByTagSelection(recipes, [veggieTag, guestsTag]))).toEqual([
      'Pâtes au pesto',
    ]);
  });

  it('combine les catégories', () => {
    expect(titlesOf(filterByTagSelection(recipes, [soupTag, winterTag]))).toEqual([
      'Soupe de lasagnes',
      'Velouté',
    ]);
  });
});

describe('collectUsedTags', () => {
  it('liste une fois chaque tag porté par une recette, trié par nom', () => {
    expect(collectUsedTags(recipes).map((tag: RecipeTag) => tag.name)).toEqual([
      'Été',
      'Hiver',
      'Pâtes',
      'Pour recevoir',
      'Soupe',
      'Végétarien',
    ]);
  });
});
