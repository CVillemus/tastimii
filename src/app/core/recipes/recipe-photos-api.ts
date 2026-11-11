import { inject, Injectable } from '@angular/core';
import { SUPABASE_CLIENT, TastimiiSupabaseClient } from '../supabase/supabase-client';

/** Bucket Storage public qui contient les photos des recettes. */
export const RECIPE_PHOTOS_BUCKET: string = 'recipe-photos';

/** Appels Supabase Storage pour les photos des recettes. */
@Injectable({ providedIn: 'root' })
export class RecipePhotosApi {
  private readonly supabaseClient: TastimiiSupabaseClient = inject(SUPABASE_CLIENT);

  /** Envoie la photo (déjà réduite) et renvoie son chemin dans le bucket. */
  async uploadRecipePhoto(recipeId: string, recipePhoto: Blob): Promise<string> {
    const photoPath: string = `${recipeId}/${crypto.randomUUID()}.jpg`;
    const { error } = await this.supabaseClient.storage
      .from(RECIPE_PHOTOS_BUCKET)
      .upload(photoPath, recipePhoto, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error !== null) {
      throw error;
    }
    return photoPath;
  }

  /** Enregistre sur la recette le chemin de sa photo (`null` = plus de photo). */
  async updateRecipePhotoPath(recipeId: string, photoPath: string | null): Promise<void> {
    const { error } = await this.supabaseClient
      .from('recipe')
      .update({ photo_path: photoPath, updated_at: new Date().toISOString() })
      .eq('id', recipeId);
    if (error !== null) {
      throw error;
    }
  }

  async deleteRecipePhoto(photoPath: string): Promise<void> {
    const { error } = await this.supabaseClient.storage
      .from(RECIPE_PHOTOS_BUCKET)
      .remove([photoPath]);
    if (error !== null) {
      throw error;
    }
  }
}
