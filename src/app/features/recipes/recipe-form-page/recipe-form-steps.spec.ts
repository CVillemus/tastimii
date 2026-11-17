import { describe, expect, it } from 'vitest';
import { createEmptyRecipeFormModel, RecipeFormModel } from './recipe-form.model';
import {
  hasNamedIngredientLine,
  hasStepWithText,
  isUntouchedRecipeFormModel,
  parseRecipeDraft,
  parseRecipeFormStep,
  serializeRecipeDraft,
} from './recipe-form-steps';

describe('parseRecipeFormStep', () => {
  it("lit l'étape de l'adresse", () => {
    expect(parseRecipeFormStep('2')).toBe(2);
    expect(parseRecipeFormStep('3')).toBe(3);
  });

  it('revient à la première étape si la valeur est absente ou inconnue', () => {
    expect(parseRecipeFormStep(undefined)).toBe(1);
    expect(parseRecipeFormStep('7')).toBe(1);
    expect(parseRecipeFormStep('ingredients')).toBe(1);
  });
});

describe("conditions pour passer à l'étape suivante", () => {
  it('il faut au moins un ingrédient nommé', () => {
    const emptyModel: RecipeFormModel = createEmptyRecipeFormModel();
    expect(hasNamedIngredientLine(emptyModel.ingredientLines)).toBe(false);
    expect(
      hasNamedIngredientLine([
        { ingredientName: '  ', quantity: null, unit: '', newIngredientTypeId: '' },
        { ingredientName: 'Poireau', quantity: 2, unit: '', newIngredientTypeId: '' },
      ]),
    ).toBe(true);
  });

  it('il faut au moins une étape avec un texte (le titre proposé au départ ne suffit pas)', () => {
    expect(hasStepWithText(createEmptyRecipeFormModel().steps)).toBe(false);
    expect(hasStepWithText([{ title: 'Le coup de feu', contentHtml: '<p>&nbsp;</p>' }])).toBe(
      false,
    );
    expect(hasStepWithText([{ title: '', contentHtml: '<p>Faire revenir.</p>' }])).toBe(true);
  });
});

describe('brouillon de nouvelle recette', () => {
  it('relit un brouillon enregistré', () => {
    const draft: RecipeFormModel = { ...createEmptyRecipeFormModel(), title: 'Gratin dauphinois' };
    expect(parseRecipeDraft(serializeRecipeDraft(draft))).toEqual(draft);
  });

  it('ignore un brouillon absent, illisible ou qui ne ressemble pas à une recette', () => {
    expect(parseRecipeDraft(null)).toBeNull();
    expect(parseRecipeDraft('{pas du json')).toBeNull();
    expect(parseRecipeDraft('{"titre":"ancien format"}')).toBeNull();
  });

  it("un formulaire où rien n'a été saisi n'a pas besoin de brouillon", () => {
    expect(isUntouchedRecipeFormModel(createEmptyRecipeFormModel())).toBe(true);
    expect(isUntouchedRecipeFormModel({ ...createEmptyRecipeFormModel(), title: 'Soupe' })).toBe(
      false,
    );
  });
});
