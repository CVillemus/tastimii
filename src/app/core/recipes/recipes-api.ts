import { inject, Injectable } from '@angular/core';
import {
  IngredientRow,
  RecipeIngredientRow,
  RecipePreparationStepJson,
  RecipeRow,
  RecipeTagRow,
  TagRow,
} from '../supabase/database.types';
import { SUPABASE_CLIENT, TastimiiSupabaseClient } from '../supabase/supabase-client';
import {
  Recipe,
  RecipeDraft,
  RecipeDraftIngredientLine,
  RecipeIngredientLine,
  RecipeStep,
  RecipeSummary,
} from './recipe.model';
import { compareTagsByName, RecipeTag } from '../tags/tag.model';
import { RECIPE_PHOTOS_BUCKET } from './recipe-photos-api';

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
    const tagsByRecipeId: Map<string, RecipeTag[]> = await this.fetchTagsByRecipeId();
    return recipeRows.map((recipeRow: RecipeRow) =>
      this.toRecipeSummary(recipeRow, tagsByRecipeId.get(recipeRow.id) ?? []),
    );
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
    const tagsByRecipeId: Map<string, RecipeTag[]> = await this.fetchTagsByRecipeId(recipeId);
    const ingredientNamesById: Map<string, string> = await this.fetchIngredientNamesById(
      recipeIngredientsResponse.data.map(
        (recipeIngredientRow: RecipeIngredientRow) => recipeIngredientRow.ingredient_id,
      ),
    );
    return {
      ...this.toRecipeSummary(recipeResponse.data, tagsByRecipeId.get(recipeId) ?? []),
      photoPath: recipeResponse.data.photo_path,
      steps: recipeResponse.data.preparation_steps.map(
        (preparationStep: RecipePreparationStepJson): RecipeStep => ({
          title: preparationStep.title,
          contentHtml: preparationStep.content_html,
        }),
      ),
      descriptionHtml: recipeResponse.data.description,
      // `?? ''` : avant le script 008, la colonne n'existe pas.
      origin: recipeResponse.data.origin ?? '',
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
    await this.insertRecipeTags(createdRecipeRow.id, recipeDraft.tagIds);
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
    const { error: deleteTagsError } = await this.supabaseClient
      .from('recipe_tag')
      .delete()
      .eq('recipe_id', recipeId);
    if (deleteTagsError !== null) {
      throw deleteTagsError;
    }
    await this.insertRecipeTags(recipeId, recipeDraft.tagIds);
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    const { error } = await this.supabaseClient.from('recipe').delete().eq('id', recipeId);
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

  private async insertRecipeTags(recipeId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) {
      return;
    }
    const { error } = await this.supabaseClient
      .from('recipe_tag')
      .insert(
        tagIds.map((tagId: string): RecipeTagRow => ({ recipe_id: recipeId, tag_id: tagId })),
      );
    if (error !== null) {
      throw error;
    }
  }

  /** Tags de toutes les recettes, ou d'une seule si `recipeId` est donné. */
  private async fetchTagsByRecipeId(recipeId?: string): Promise<Map<string, RecipeTag[]>> {
    const [recipeTagsResponse, tagsResponse] = await Promise.all([
      recipeId === undefined
        ? this.supabaseClient.from('recipe_tag').select('*')
        : this.supabaseClient.from('recipe_tag').select('*').eq('recipe_id', recipeId),
      this.supabaseClient.from('tag').select('*'),
    ]);
    if (recipeTagsResponse.error !== null) {
      throw recipeTagsResponse.error;
    }
    if (tagsResponse.error !== null) {
      throw tagsResponse.error;
    }
    const tagsById: Map<string, RecipeTag> = new Map(
      tagsResponse.data.map((tagRow: TagRow): [string, RecipeTag] => [
        tagRow.id,
        { id: tagRow.id, name: tagRow.name },
      ]),
    );
    const tagsByRecipeId: Map<string, RecipeTag[]> = new Map();
    for (const recipeTagRow of recipeTagsResponse.data) {
      const recipeTag: RecipeTag | undefined = tagsById.get(recipeTagRow.tag_id);
      if (recipeTag !== undefined) {
        tagsByRecipeId.set(recipeTagRow.recipe_id, [
          ...(tagsByRecipeId.get(recipeTagRow.recipe_id) ?? []),
          recipeTag,
        ]);
      }
    }
    for (const recipeTags of tagsByRecipeId.values()) {
      recipeTags.sort(compareTagsByName);
    }
    return tagsByRecipeId;
  }

  private toRecipeSummary(recipeRow: RecipeRow, recipeTags: RecipeTag[]): RecipeSummary {
    return {
      id: recipeRow.id,
      title: recipeRow.title,
      baseServings: recipeRow.base_servings,
      preparationMinutes: recipeRow.preparation_minutes,
      photoUrl:
        recipeRow.photo_path === null ? null : this.buildRecipePhotoUrl(recipeRow.photo_path),
      tags: recipeTags,
    };
  }

  private buildRecipePhotoUrl(photoPath: string): string {
    return this.supabaseClient.storage.from(RECIPE_PHOTOS_BUCKET).getPublicUrl(photoPath).data
      .publicUrl;
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

function toRecipeColumns(
  recipeDraft: RecipeDraft,
): Pick<
  RecipeRow,
  'title' | 'base_servings' | 'preparation_minutes' | 'preparation_steps' | 'description' | 'origin'
> {
  return {
    title: recipeDraft.title.trim(),
    base_servings: recipeDraft.baseServings,
    preparation_minutes: recipeDraft.preparationMinutes,
    preparation_steps: recipeDraft.steps.map(
      (recipeStep: RecipeStep): RecipePreparationStepJson => ({
        title: recipeStep.title.trim(),
        content_html: recipeStep.contentHtml,
      }),
    ),
    description: recipeDraft.descriptionHtml,
    origin: recipeDraft.origin.trim(),
  };
}
