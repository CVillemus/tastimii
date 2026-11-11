import { inject, Injectable } from '@angular/core';
import { TagRow } from '../supabase/database.types';
import { SUPABASE_CLIENT, TastimiiSupabaseClient } from '../supabase/supabase-client';
import { compareTagsByName, RecipeTag } from './tag.model';

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

  async createTag(tagName: string): Promise<RecipeTag> {
    const { data: createdTagRow, error } = await this.supabaseClient
      .from('tag')
      .insert({ name: tagName.trim() })
      .select()
      .single();
    if (error !== null) {
      throw error;
    }
    return toRecipeTag(createdTagRow);
  }
}

function toRecipeTag(tagRow: TagRow): RecipeTag {
  return { id: tagRow.id, name: tagRow.name };
}
