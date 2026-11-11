import { inject, Injectable } from '@angular/core';
import { IngredientsApi } from '../ingredients/ingredients-api';
import {
  RecipeIngredientRow,
  RecipeRow,
  ShoppingListCheckedLineRow,
  ShoppingListRecipeRow,
} from '../supabase/database.types';
import { SUPABASE_CLIENT, TastimiiSupabaseClient } from '../supabase/supabase-client';
import { buildItemsToCheckAtHome, buildShoppingListAisles } from './build-shopping-list-aisles';
import { ShoppingList, ShoppingListMenuRecipe } from './shopping-list.model';

/** Appels Supabase de la liste de courses (une seule liste, partagée à deux). */
@Injectable({ providedIn: 'root' })
export class ShoppingListApi {
  private readonly supabaseClient: TastimiiSupabaseClient = inject(SUPABASE_CLIENT);
  private readonly ingredientsApi: IngredientsApi = inject(IngredientsApi);

  async fetchShoppingList(): Promise<ShoppingList> {
    const [menuEntriesResponse, checkedLinesResponse, ingredientCatalog] = await Promise.all([
      this.supabaseClient.from('shopping_list_recipe').select('*').order('added_at'),
      this.supabaseClient.from('shopping_list_checked_line').select('*'),
      this.ingredientsApi.fetchIngredientCatalog(),
    ]);
    if (menuEntriesResponse.error !== null) {
      throw menuEntriesResponse.error;
    }
    if (checkedLinesResponse.error !== null) {
      throw checkedLinesResponse.error;
    }

    const menuRecipes: ShoppingListMenuRecipe[] = await this.fetchMenuRecipes(
      menuEntriesResponse.data,
    );
    const checkedLineKeys: Set<string> = new Set(
      checkedLinesResponse.data.map(
        (checkedLineRow: ShoppingListCheckedLineRow) => checkedLineRow.line_key,
      ),
    );
    return {
      menuRecipes,
      itemsToCheckAtHome: buildItemsToCheckAtHome(menuRecipes, ingredientCatalog, checkedLineKeys),
      aisles: buildShoppingListAisles(menuRecipes, ingredientCatalog, checkedLineKeys),
    };
  }

  async addRecipeToShoppingList(recipeId: string, wantedServings: number): Promise<void> {
    const { error } = await this.supabaseClient
      .from('shopping_list_recipe')
      .insert({ recipe_id: recipeId, servings: wantedServings });
    if (error !== null) {
      throw error;
    }
  }

  async changeMenuRecipeServings(menuEntryId: string, wantedServings: number): Promise<void> {
    const { error } = await this.supabaseClient
      .from('shopping_list_recipe')
      .update({ servings: wantedServings })
      .eq('id', menuEntryId);
    if (error !== null) {
      throw error;
    }
  }

  async removeRecipeFromShoppingList(menuEntryId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('shopping_list_recipe')
      .delete()
      .eq('id', menuEntryId);
    if (error !== null) {
      throw error;
    }
  }

  async checkShoppingListLine(lineKey: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('shopping_list_checked_line')
      .upsert({ line_key: lineKey });
    if (error !== null) {
      throw error;
    }
  }

  async uncheckShoppingListLine(lineKey: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('shopping_list_checked_line')
      .delete()
      .eq('line_key', lineKey);
    if (error !== null) {
      throw error;
    }
  }

  /** Vide toute la liste : recettes au menu et lignes cochées. */
  async clearShoppingList(): Promise<void> {
    // Supabase refuse un `delete()` sans filtre : ces filtres sont toujours vrais.
    const [menuDeletion, checkedLinesDeletion] = await Promise.all([
      this.supabaseClient.from('shopping_list_recipe').delete().not('id', 'is', null),
      this.supabaseClient.from('shopping_list_checked_line').delete().not('line_key', 'is', null),
    ]);
    if (menuDeletion.error !== null) {
      throw menuDeletion.error;
    }
    if (checkedLinesDeletion.error !== null) {
      throw checkedLinesDeletion.error;
    }
  }

  private async fetchMenuRecipes(
    menuEntryRows: ShoppingListRecipeRow[],
  ): Promise<ShoppingListMenuRecipe[]> {
    if (menuEntryRows.length === 0) {
      return [];
    }
    const recipeIds: string[] = [
      ...new Set(
        menuEntryRows.map((menuEntryRow: ShoppingListRecipeRow) => menuEntryRow.recipe_id),
      ),
    ];
    const [recipesResponse, recipeIngredientsResponse] = await Promise.all([
      this.supabaseClient.from('recipe').select('*').in('id', recipeIds),
      this.supabaseClient.from('recipe_ingredient').select('*').in('recipe_id', recipeIds),
    ]);
    if (recipesResponse.error !== null) {
      throw recipesResponse.error;
    }
    if (recipeIngredientsResponse.error !== null) {
      throw recipeIngredientsResponse.error;
    }
    const recipesById: Map<string, RecipeRow> = new Map(
      recipesResponse.data.map((recipeRow: RecipeRow) => [recipeRow.id, recipeRow]),
    );

    return menuEntryRows.flatMap(
      (menuEntryRow: ShoppingListRecipeRow): ShoppingListMenuRecipe[] => {
        const recipeRow: RecipeRow | undefined = recipesById.get(menuEntryRow.recipe_id);
        if (recipeRow === undefined) {
          return [];
        }
        return [
          {
            menuEntryId: menuEntryRow.id,
            recipeId: recipeRow.id,
            recipeTitle: recipeRow.title,
            baseServings: recipeRow.base_servings,
            wantedServings: menuEntryRow.servings,
            ingredientLines: recipeIngredientsResponse.data
              .filter(
                (recipeIngredientRow: RecipeIngredientRow) =>
                  recipeIngredientRow.recipe_id === recipeRow.id,
              )
              .map((recipeIngredientRow: RecipeIngredientRow) => ({
                ingredientId: recipeIngredientRow.ingredient_id,
                quantity: recipeIngredientRow.quantity,
                unit: recipeIngredientRow.unit,
              })),
          },
        ];
      },
    );
  }
}
