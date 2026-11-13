import { inject, Injectable } from '@angular/core';
import { RecipeSummary } from '../recipes/recipe.model';
import { RecipesApi } from '../recipes/recipes-api';
import { KitchenRecipeRow } from '../supabase/database.types';
import { SUPABASE_CLIENT, TastimiiSupabaseClient } from '../supabase/supabase-client';
import { KitchenRecipe } from './kitchen.model';

/** Appels Supabase de la cuisine : recettes dont les courses sont faites. */
@Injectable({ providedIn: 'root' })
export class KitchenApi {
  private readonly supabaseClient: TastimiiSupabaseClient = inject(SUPABASE_CLIENT);
  private readonly recipesApi: RecipesApi = inject(RecipesApi);

  /** Recettes en cuisine, de la plus ancienne à la plus récente. */
  async fetchKitchenRecipes(): Promise<KitchenRecipe[]> {
    const [kitchenResponse, recipeSummaries] = await Promise.all([
      this.supabaseClient.from('kitchen_recipe').select('*').order('added_at'),
      this.recipesApi.fetchRecipeSummaries(),
    ]);
    if (kitchenResponse.error !== null) {
      throw kitchenResponse.error;
    }
    const recipeSummariesById: Map<string, RecipeSummary> = new Map(
      recipeSummaries.map((recipeSummary: RecipeSummary) => [recipeSummary.id, recipeSummary]),
    );
    return kitchenResponse.data.flatMap((kitchenRecipeRow: KitchenRecipeRow): KitchenRecipe[] => {
      const recipe: RecipeSummary | undefined = recipeSummariesById.get(kitchenRecipeRow.recipe_id);
      return recipe === undefined
        ? []
        : [
            {
              kitchenEntryId: kitchenRecipeRow.id,
              recipe,
              servings: kitchenRecipeRow.servings,
              addedAt: kitchenRecipeRow.added_at,
            },
          ];
    });
  }

  /** Nombre de recettes en cuisine, pour afficher ou non l'onglet Cuisine. */
  async countKitchenRecipes(): Promise<number> {
    const { count, error } = await this.supabaseClient
      .from('kitchen_recipe')
      .select('*', { count: 'exact', head: true });
    if (error !== null) {
      throw error;
    }
    return count ?? 0;
  }

  /**
   * « Courses faites » : les recettes au menu passent en cuisine et la liste de courses est vidée,
   * en une seule opération côté base. Renvoie le nombre de recettes passées en cuisine.
   */
  async finishShopping(): Promise<number> {
    const { data: movedRecipeCount, error } = await this.supabaseClient.rpc('finish_shopping');
    if (error !== null) {
      throw error;
    }
    return movedRecipeCount;
  }

  /** « Cuisinée » : la recette est comptée dans l'historique et quitte la cuisine. */
  async markKitchenRecipeCooked(kitchenEntryId: string): Promise<void> {
    const { error } = await this.supabaseClient.rpc('mark_kitchen_recipe_cooked', {
      kitchen_recipe_id: kitchenEntryId,
    });
    if (error !== null) {
      throw error;
    }
  }

  /** « Retirer » : la recette quitte la cuisine sans être comptée comme cuisinée. */
  async removeKitchenRecipe(kitchenEntryId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('kitchen_recipe')
      .delete()
      .eq('id', kitchenEntryId);
    if (error !== null) {
      throw error;
    }
  }
}
