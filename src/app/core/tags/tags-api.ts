import { inject, Injectable } from '@angular/core';
import { RecipeTagRow, TagRow } from '../supabase/database.types';
import { SUPABASE_CLIENT, TastimiiSupabaseClient } from '../supabase/supabase-client';
import { compareTagsByName, RecipeTag, TAG_CATEGORIES, TagCategory } from './tag.model';

/** Appels Supabase des tags de recettes. */
@Injectable({ providedIn: 'root' })
export class TagsApi {
  private readonly supabaseClient: TastimiiSupabaseClient = inject(SUPABASE_CLIENT);

  /** Tous les tags existants, triés par nom. */
  async fetchTags(): Promise<RecipeTag[]> {
    const { data: tagRows, error } = await this.supabaseClient.from('tag').select('*');
    if (error !== null) {
      throw error;
    }
    return tagRows.map(toRecipeTag).sort(compareTagsByName);
  }

  /** Nombre de recettes qui portent chaque tag (un tag absent n'est sur aucune recette). */
  async fetchTagUsageCounts(): Promise<Map<string, number>> {
    const { data: recipeTagRows, error } = await this.supabaseClient
      .from('recipe_tag')
      .select('tag_id');
    if (error !== null) {
      throw error;
    }
    const tagUsageCounts: Map<string, number> = new Map();
    for (const recipeTagRow of recipeTagRows as Pick<RecipeTagRow, 'tag_id'>[]) {
      tagUsageCounts.set(recipeTagRow.tag_id, (tagUsageCounts.get(recipeTagRow.tag_id) ?? 0) + 1);
    }
    return tagUsageCounts;
  }

  async createTag(tagName: string, category: TagCategory): Promise<RecipeTag> {
    const { data: createdTagRow, error } = await this.supabaseClient
      .from('tag')
      .insert({ name: tagName.trim(), category })
      .select()
      .single();
    if (error !== null) {
      throw error;
    }
    return toRecipeTag(createdTagRow);
  }

  async updateTag(tagId: string, tagName: string, category: TagCategory): Promise<void> {
    const { error } = await this.supabaseClient
      .from('tag')
      .update({ name: tagName.trim(), category })
      .eq('id', tagId);
    if (error !== null) {
      throw error;
    }
  }

  /** Supprime le tag ; il disparaît aussi des recettes qui le portaient (suppression en cascade). */
  async deleteTag(tagId: string): Promise<void> {
    const { error } = await this.supabaseClient.from('tag').delete().eq('id', tagId);
    if (error !== null) {
      throw error;
    }
  }
}

/** Une ligne `tag` lue en base. Avant le script 011, il n'y a pas de catégorie : c'est une envie. */
export function toRecipeTag(tagRow: TagRow): RecipeTag {
  return { id: tagRow.id, name: tagRow.name, category: toTagCategory(tagRow.category) };
}

function toTagCategory(category: string | undefined): TagCategory {
  return TAG_CATEGORIES.find((definition) => definition.category === category)?.category ?? 'envie';
}
