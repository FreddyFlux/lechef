import type { Id } from "@/convex/_generated/dataModel";

/**
 * Recipe data returned from search queries with additional fields
 */
export interface RecipeSearchResult {
  _id: Id<"recipes">;
  userId: string;
  title: string;
  description?: string;
  cuisine: string[];
  skillLevel: string;
  cookTime: number;
  prepTime: number;
  cost: string;
  canFreeze: boolean;
  canReheat: boolean;
  servings: number;
  createdAt: number;
  updatedAt: number;
  slug?: string;
  isPublic?: boolean;
  imageStorageId?: Id<"_storage">;
  imageUrl: string | null;
  isOwnRecipe: boolean;
}

/**
 * Recipe data with full details (ingredients and steps)
 */
export interface RecipeWithDetails extends RecipeSearchResult {
  ingredients: Array<{ name: string; amount?: string }>;
  steps: Array<{ instruction: string; stepNumber?: number }>;
}

