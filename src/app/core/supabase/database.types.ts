/**
 * Types de la base Supabase, écrits à la main d'après supabase/migrations/001_schema_tastimii.sql.
 * Ce sont des `type` et non des `interface` : supabase-js l'exige, sinon le client est typé en `never`.
 * Une faute de nom de colonne ne compile donc pas.
 */
export type IngredientFamilyRow = {
  id: string;
  name: string;
  parent_family_id: string | null;
  created_at: string;
};

export type IngredientRow = {
  id: string;
  name: string;
  family_id: string;
  default_unit: string;
  created_at: string;
};

/** Une étape telle que stockée dans `recipe.preparation_steps` (jsonb). */
export type RecipePreparationStepJson = {
  title: string;
  content_html: string;
};

export type RecipeRow = {
  id: string;
  title: string;
  base_servings: number;
  preparation_minutes: number | null;
  /** Ancienne colonne des étapes (texte simple), remplacée par `preparation_steps`. Ne plus l'utiliser. */
  steps: string[];
  preparation_steps: RecipePreparationStepJson[];
  /** Chemin de la photo dans le bucket Storage `recipe-photos`, ou `null` sans photo. */
  photo_path: string | null;
  /** Texte riche (HTML de l'éditeur) : description libre, remarques. Vide = ''. */
  description: string;
  created_at: string;
  updated_at: string;
};

export type RecipeIngredientRow = {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number | null;
  unit: string;
  position: number;
};

export type TagRow = {
  id: string;
  name: string;
  created_at: string;
};

export type RecipeTagRow = {
  recipe_id: string;
  tag_id: string;
};

export type ShoppingListRecipeRow = {
  id: string;
  recipe_id: string;
  servings: number;
  added_at: string;
};

export type ShoppingListCheckedLineRow = {
  line_key: string;
  checked_at: string;
};

export type Database = {
  public: {
    Tables: {
      ingredient_family: {
        Row: IngredientFamilyRow;
        Insert: Pick<IngredientFamilyRow, 'name'> & Partial<IngredientFamilyRow>;
        Update: Partial<IngredientFamilyRow>;
        Relationships: [];
      };
      ingredient: {
        Row: IngredientRow;
        Insert: Pick<IngredientRow, 'name' | 'family_id'> & Partial<IngredientRow>;
        Update: Partial<IngredientRow>;
        Relationships: [];
      };
      recipe: {
        Row: RecipeRow;
        Insert: Pick<RecipeRow, 'title' | 'base_servings'> & Partial<RecipeRow>;
        Update: Partial<RecipeRow>;
        Relationships: [];
      };
      recipe_ingredient: {
        Row: RecipeIngredientRow;
        Insert: Pick<RecipeIngredientRow, 'recipe_id' | 'ingredient_id' | 'position'> &
          Partial<RecipeIngredientRow>;
        Update: Partial<RecipeIngredientRow>;
        Relationships: [];
      };
      tag: {
        Row: TagRow;
        Insert: Pick<TagRow, 'name'> & Partial<TagRow>;
        Update: Partial<TagRow>;
        Relationships: [];
      };
      recipe_tag: {
        Row: RecipeTagRow;
        Insert: RecipeTagRow;
        Update: Partial<RecipeTagRow>;
        Relationships: [];
      };
      shopping_list_recipe: {
        Row: ShoppingListRecipeRow;
        Insert: Pick<ShoppingListRecipeRow, 'recipe_id' | 'servings'> &
          Partial<ShoppingListRecipeRow>;
        Update: Partial<ShoppingListRecipeRow>;
        Relationships: [];
      };
      shopping_list_checked_line: {
        Row: ShoppingListCheckedLineRow;
        Insert: Pick<ShoppingListCheckedLineRow, 'line_key'> & Partial<ShoppingListCheckedLineRow>;
        Update: Partial<ShoppingListCheckedLineRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
