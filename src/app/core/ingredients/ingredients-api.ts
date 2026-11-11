import { inject, Injectable } from '@angular/core';
import { IngredientFamilyRow, IngredientRow } from '../supabase/database.types';
import { SUPABASE_CLIENT, TastimiiSupabaseClient } from '../supabase/supabase-client';
import {
  Ingredient,
  IngredientCatalog,
  IngredientChanges,
  IngredientType,
} from './ingredient.model';

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
    isUsuallyAtHome: boolean = false,
  ): Promise<Ingredient> {
    const { data: createdIngredientRow, error } = await this.supabaseClient
      .from('ingredient')
      .insert({
        name: ingredientName.trim(),
        family_id: typeId,
        default_unit: defaultUnit.trim(),
        is_usually_at_home: isUsuallyAtHome,
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

  async updateIngredient(
    ingredientId: string,
    ingredientChanges: IngredientChanges,
  ): Promise<void> {
    const { error } = await this.supabaseClient
      .from('ingredient')
      .update({
        name: ingredientChanges.name.trim(),
        family_id: ingredientChanges.typeId,
        default_unit: ingredientChanges.defaultUnit.trim(),
        is_usually_at_home: ingredientChanges.isUsuallyAtHome,
      })
      .eq('id', ingredientId);
    if (error !== null) {
      throw error;
    }
  }

  async renameIngredientType(typeId: string, typeName: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('ingredient_family')
      .update({ name: typeName.trim() })
      .eq('id', typeId);
    if (error !== null) {
      throw error;
    }
  }

  /** Titres des recettes qui utilisent un ingrédient (pour expliquer un refus de suppression). */
  async fetchRecipeTitlesUsingIngredient(ingredientId: string): Promise<string[]> {
    const { data: recipeIngredientRows, error } = await this.supabaseClient
      .from('recipe_ingredient')
      .select('recipe_id')
      .eq('ingredient_id', ingredientId);
    if (error !== null) {
      throw error;
    }
    const recipeIds: string[] = [
      ...new Set(recipeIngredientRows.map((row: { recipe_id: string }) => row.recipe_id)),
    ];
    if (recipeIds.length === 0) {
      return [];
    }
    const { data: recipeRows, error: recipesError } = await this.supabaseClient
      .from('recipe')
      .select('title')
      .in('id', recipeIds)
      .order('title');
    if (recipesError !== null) {
      throw recipesError;
    }
    return recipeRows.map((row: { title: string }) => row.title);
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
    // `=== true` : avant le script 006, la colonne n'existe pas et la valeur est absente.
    isUsuallyAtHome: ingredientRow.is_usually_at_home === true,
  };
}
