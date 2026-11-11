import { inject, Injectable } from '@angular/core';
import { IngredientRow, RecipeIngredientRow, RecipeRow } from '../supabase/database.types';
import { SUPABASE_CLIENT, TastimiiSupabaseClient } from '../supabase/supabase-client';
import {
  Recipe,
  RecipeDraft,
  RecipeDraftIngredientLine,
  RecipeIngredientLine,
  RecipeSummary,
} from './recipe.model';

/** Appels Supabase des recettes. */
@Injectable({ providedIn: 'root' })
export class RecipesApi {
  private readonly supabaseClient: TastimiiSupabaseClient = inject(SUPABASE_CLIENT);

  async fetchRecipeSummaries(): Promise<RecipeSummary[]> {
    const { data: recipeRows, error } = await this.supabaseClient
      .from('recipe')
      .select('*')
      .order('title');
    if (error !== null) {
      throw error;
    }
    return recipeRows.map(toRecipeSummary);
  }

  async fetchRecipe(recipeId: string): Promise<Recipe> {
    const [recipeResponse, recipeIngredientsResponse] = await Promise.all([
      this.supabaseClient.from('recipe').select('*').eq('id', recipeId).single(),
      this.supabaseClient
        .from('recipe_ingredient')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('position'),
    ]);
    if (recipeResponse.error !== null) {
      throw recipeResponse.error;
    }
    if (recipeIngredientsResponse.error !== null) {
      throw recipeIngredientsResponse.error;
    }
    const ingredientNamesById: Map<string, string> = await this.fetchIngredientNamesById(
      recipeIngredientsResponse.data.map(
        (recipeIngredientRow: RecipeIngredientRow) => recipeIngredientRow.ingredient_id,
      ),
    );
    return {
      ...toRecipeSummary(recipeResponse.data),
      steps: recipeResponse.data.steps,
      descriptionHtml: recipeResponse.data.description,
      ingredientLines: recipeIngredientsResponse.data.map(
        (recipeIngredientRow: RecipeIngredientRow): RecipeIngredientLine => ({
          ingredientId: recipeIngredientRow.ingredient_id,
          ingredientName: ingredientNamesById.get(recipeIngredientRow.ingredient_id) ?? '?',
          quantity: recipeIngredientRow.quantity,
          unit: recipeIngredientRow.unit,
        }),
      ),
    };
  }

  /** Crée la recette, puis ses lignes d'ingrédients. Renvoie l'identifiant de la recette. */
  async createRecipe(recipeDraft: RecipeDraft): Promise<string> {
    const { data: createdRecipeRow, error } = await this.supabaseClient
      .from('recipe')
      .insert(toRecipeColumns(recipeDraft))
      .select()
      .single();
    if (error !== null) {
      throw error;
    }
    await this.insertRecipeIngredientLines(createdRecipeRow.id, recipeDraft.ingredientLines);
    return createdRecipeRow.id;
  }

  /** Met à jour la recette et remplace toutes ses lignes d'ingrédients. */
  async updateRecipe(recipeId: string, recipeDraft: RecipeDraft): Promise<void> {
    const { error: recipeError } = await this.supabaseClient
      .from('recipe')
      .update({ ...toRecipeColumns(recipeDraft), updated_at: new Date().toISOString() })
      .eq('id', recipeId);
    if (recipeError !== null) {
      throw recipeError;
    }
    const { error: deleteLinesError } = await this.supabaseClient
      .from('recipe_ingredient')
      .delete()
      .eq('recipe_id', recipeId);
    if (deleteLinesError !== null) {
      throw deleteLinesError;
    }
    await this.insertRecipeIngredientLines(recipeId, recipeDraft.ingredientLines);
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    const { error } = await this.supabaseClient.from('recipe').delete().eq('id', recipeId);
    if (error !== null) {
      throw error;
    }
  }

  /** Modifie seulement la description, depuis la fiche recette. */
  async updateRecipeDescription(recipeId: string, descriptionHtml: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('recipe')
      .update({ description: descriptionHtml, updated_at: new Date().toISOString() })
      .eq('id', recipeId);
    if (error !== null) {
      throw error;
    }
  }

  private async insertRecipeIngredientLines(
    recipeId: string,
    ingredientLines: RecipeDraftIngredientLine[],
  ): Promise<void> {
    if (ingredientLines.length === 0) {
      return;
    }
    const { error } = await this.supabaseClient.from('recipe_ingredient').insert(
      ingredientLines.map((ingredientLine: RecipeDraftIngredientLine, position: number) => ({
        recipe_id: recipeId,
        ingredient_id: ingredientLine.ingredientId,
        quantity: ingredientLine.quantity,
        unit: ingredientLine.unit.trim(),
        position,
      })),
    );
    if (error !== null) {
      throw error;
    }
  }

  private async fetchIngredientNamesById(ingredientIds: string[]): Promise<Map<string, string>> {
    if (ingredientIds.length === 0) {
      return new Map<string, string>();
    }
    const { data: ingredientRows, error } = await this.supabaseClient
      .from('ingredient')
      .select('*')
      .in('id', ingredientIds);
    if (error !== null) {
      throw error;
    }
    return new Map(
      ingredientRows.map((ingredientRow: IngredientRow) => [ingredientRow.id, ingredientRow.name]),
    );
  }
}

function toRecipeSummary(recipeRow: RecipeRow): RecipeSummary {
  return {
    id: recipeRow.id,
    title: recipeRow.title,
    baseServings: recipeRow.base_servings,
    preparationMinutes: recipeRow.preparation_minutes,
  };
}

function toRecipeColumns(
  recipeDraft: RecipeDraft,
): Pick<RecipeRow, 'title' | 'base_servings' | 'preparation_minutes' | 'steps' | 'description'> {
  return {
    title: recipeDraft.title.trim(),
    base_servings: recipeDraft.baseServings,
    preparation_minutes: recipeDraft.preparationMinutes,
    steps: recipeDraft.steps,
    description: recipeDraft.descriptionHtml,
  };
}
