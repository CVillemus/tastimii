import { inject, Injectable } from '@angular/core';
import { IngredientFamilyRow, IngredientRow } from '../supabase/database.types';
import { SUPABASE_CLIENT, TastimiiSupabaseClient } from '../supabase/supabase-client';
import { Ingredient, IngredientCatalog, IngredientType } from './ingredient.model';

/**
 * Appels Supabase des types d'ingrédients et des ingrédients.
 * En base, un type est une ligne de `ingredient_family` et l'ingrédient pointe dessus par `family_id`.
 */
@Injectable({ providedIn: 'root' })
export class IngredientsApi {
  private readonly supabaseClient: TastimiiSupabaseClient = inject(SUPABASE_CLIENT);

  async fetchIngredientCatalog(): Promise<IngredientCatalog> {
    const [typesResponse, ingredientsResponse] = await Promise.all([
      this.supabaseClient.from('ingredient_family').select('*').order('name'),
      this.supabaseClient.from('ingredient').select('*').order('name'),
    ]);
    if (typesResponse.error !== null) {
      throw typesResponse.error;
    }
    if (ingredientsResponse.error !== null) {
      throw ingredientsResponse.error;
    }
    return {
      types: typesResponse.data.map(toIngredientType),
      ingredients: ingredientsResponse.data.map(toIngredient),
    };
  }

  async createIngredientType(typeName: string): Promise<IngredientType> {
    const { data: createdTypeRow, error } = await this.supabaseClient
      .from('ingredient_family')
      .insert({ name: typeName.trim() })
      .select()
      .single();
    if (error !== null) {
      throw error;
    }
    return toIngredientType(createdTypeRow);
  }

  async deleteIngredientType(typeId: string): Promise<void> {
    const { error } = await this.supabaseClient.from('ingredient_family').delete().eq('id', typeId);
    if (error !== null) {
      throw error;
    }
  }

  async createIngredient(
    ingredientName: string,
    typeId: string,
    defaultUnit: string,
  ): Promise<Ingredient> {
    const { data: createdIngredientRow, error } = await this.supabaseClient
      .from('ingredient')
      .insert({
        name: ingredientName.trim(),
        family_id: typeId,
        default_unit: defaultUnit.trim(),
      })
      .select()
      .single();
    if (error !== null) {
      throw error;
    }
    return toIngredient(createdIngredientRow);
  }

  async changeIngredientType(ingredientId: string, typeId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('ingredient')
      .update({ family_id: typeId })
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

function toIngredientType(typeRow: IngredientFamilyRow): IngredientType {
  return { id: typeRow.id, name: typeRow.name };
}

function toIngredient(ingredientRow: IngredientRow): Ingredient {
  return {
    id: ingredientRow.id,
    name: ingredientRow.name,
    typeId: ingredientRow.family_id,
    defaultUnit: ingredientRow.default_unit,
  };
}
