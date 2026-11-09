import { inject, Injectable } from '@angular/core';
import { IngredientFamilyRow, IngredientRow } from '../supabase/database.types';
import { SUPABASE_CLIENT, TastimiiSupabaseClient } from '../supabase/supabase-client';
import { Ingredient, IngredientCatalog, IngredientFamily } from './ingredient.model';

/** Appels Supabase des familles et des ingrédients. */
@Injectable({ providedIn: 'root' })
export class IngredientsApi {
  private readonly supabaseClient: TastimiiSupabaseClient = inject(SUPABASE_CLIENT);

  async fetchIngredientCatalog(): Promise<IngredientCatalog> {
    const [familiesResponse, ingredientsResponse] = await Promise.all([
      this.supabaseClient.from('ingredient_family').select('*').order('name'),
      this.supabaseClient.from('ingredient').select('*').order('name'),
    ]);
    if (familiesResponse.error !== null) {
      throw familiesResponse.error;
    }
    if (ingredientsResponse.error !== null) {
      throw ingredientsResponse.error;
    }
    return {
      families: familiesResponse.data.map(toIngredientFamily),
      ingredients: ingredientsResponse.data.map(toIngredient),
    };
  }

  async createIngredientFamily(
    familyName: string,
    parentFamilyId: string | null,
  ): Promise<IngredientFamily> {
    const { data: createdFamilyRow, error } = await this.supabaseClient
      .from('ingredient_family')
      .insert({ name: familyName.trim(), parent_family_id: parentFamilyId })
      .select()
      .single();
    if (error !== null) {
      throw error;
    }
    return toIngredientFamily(createdFamilyRow);
  }

  async deleteIngredientFamily(familyId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('ingredient_family')
      .delete()
      .eq('id', familyId);
    if (error !== null) {
      throw error;
    }
  }

  async createIngredient(
    ingredientName: string,
    familyId: string,
    defaultUnit: string,
  ): Promise<Ingredient> {
    const { data: createdIngredientRow, error } = await this.supabaseClient
      .from('ingredient')
      .insert({
        name: ingredientName.trim(),
        family_id: familyId,
        default_unit: defaultUnit.trim(),
      })
      .select()
      .single();
    if (error !== null) {
      throw error;
    }
    return toIngredient(createdIngredientRow);
  }

  async moveIngredientToFamily(ingredientId: string, familyId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('ingredient')
      .update({ family_id: familyId })
      .eq('id', ingredientId);
    if (error !== null) {
      throw error;
    }
  }

  async deleteIngredient(ingredientId: string): Promise<void> {
    const { error } = await this.supabaseClient.from('ingredient').delete().eq('id', ingredientId);
    if (error !== null) {
      throw error;
    }
  }
}

function toIngredientFamily(familyRow: IngredientFamilyRow): IngredientFamily {
  return { id: familyRow.id, name: familyRow.name, parentFamilyId: familyRow.parent_family_id };
}

function toIngredient(ingredientRow: IngredientRow): Ingredient {
  return {
    id: ingredientRow.id,
    name: ingredientRow.name,
    familyId: ingredientRow.family_id,
    defaultUnit: ingredientRow.default_unit,
  };
}
