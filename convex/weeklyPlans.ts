import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getUserId } from "./auth";
import { api } from "./_generated/api";
import * as aiService from "./ai";

// Extract function references to avoid circular type inference issues
const createRecipeMutation = api.recipes.create;
const updateWeekMutation = api.weeklyPlans.updateWeek;
const checkSlugExistsQuery = api.recipes.checkSlugExists;

/**
 * Converts a string to a URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')          // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')             // Trim hyphens from start
    .replace(/-+$/, '');             // Trim hyphens from end
}

/**
 * Generate a unique slug from a title (for use in actions)
 */
async function generateUniqueSlugInAction(ctx: { runQuery: (query: typeof checkSlugExistsQuery, args: { slug: string }) => Promise<boolean> }, title: string): Promise<string> {
  let baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;
  
  // Check if slug exists using the query
  while (await ctx.runQuery(checkSlugExistsQuery, { slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

// Get the start of the week (Monday) for a given date
function getWeekStartDate(date: Date): number {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

// Get current week's plan
export const getCurrentWeek = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const weekStart = getWeekStartDate(new Date());
    
    const plan = await ctx.db
      .query("weeklyPlans")
      .withIndex("by_user_and_week", (q) => 
        q.eq("userId", userId).eq("weekStartDate", weekStart)
      )
      .first();
    
    if (!plan) {
      // Return default plan with empty days
      return {
        _id: null as Id<"weeklyPlans"> | null,
        userId,
        weekStartDate: weekStart,
        days: Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          recipeId: undefined as Id<"recipes"> | undefined,
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    
    // Fetch recipe details for each day
    const daysWithRecipes = await Promise.all(
      plan.days.map(async (day) => {
        if (!day.recipeId) {
          return { ...day, recipeId: day.recipeId, recipe: null };
        }
        
        const recipe = await ctx.db.get(day.recipeId);
        if (!recipe) {
          return { ...day, recipeId: day.recipeId, recipe: null };
        }
        
        // Get image URL if exists
        const imageUrl = recipe.imageStorageId
          ? await ctx.storage.getUrl(recipe.imageStorageId)
          : null;
        
        return {
          ...day,
          recipeId: day.recipeId,
          recipe: {
            ...recipe,
            imageUrl,
            isOwnRecipe: recipe.userId === userId,
          },
        };
      })
    );
    
    return {
      ...plan,
      days: daysWithRecipes,
    };
  },
});

// Get plan for a specific week
export const getWeek = query({
  args: { weekStartDate: v.number() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    const plan = await ctx.db
      .query("weeklyPlans")
      .withIndex("by_user_and_week", (q) => 
        q.eq("userId", userId).eq("weekStartDate", args.weekStartDate)
      )
      .first();
    
    if (!plan) {
      // Return default plan with empty days
      return {
        _id: null as Id<"weeklyPlans"> | null,
        userId,
        weekStartDate: args.weekStartDate,
        days: Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          recipeId: undefined as Id<"recipes"> | undefined,
        })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    
    // Fetch recipe details for each day
    const daysWithRecipes = await Promise.all(
      plan.days.map(async (day) => {
        if (!day.recipeId) {
          return { ...day, recipeId: day.recipeId, recipe: null };
        }
        
        const recipe = await ctx.db.get(day.recipeId);
        if (!recipe) {
          return { ...day, recipeId: day.recipeId, recipe: null };
        }
        
        // Get image URL if exists
        const imageUrl = recipe.imageStorageId
          ? await ctx.storage.getUrl(recipe.imageStorageId)
          : null;
        
        return {
          ...day,
          recipeId: day.recipeId,
          recipe: {
            ...recipe,
            imageUrl,
            isOwnRecipe: recipe.userId === userId,
          },
        };
      })
    );
    
    return {
      ...plan,
      days: daysWithRecipes,
    };
  },
});

// Update or create weekly plan
export const updateWeek = mutation({
  args: {
    weekStartDate: v.number(),
    days: v.array(v.object({
      dayOfWeek: v.number(),
      recipeId: v.optional(v.id("recipes")),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    // Verify that all recipe IDs belong to the user or are public
    for (const day of args.days) {
      if (day.recipeId) {
        const recipe = await ctx.db.get(day.recipeId);
        if (!recipe) {
          throw new Error(`Recipe not found for day ${day.dayOfWeek}`);
        }
        // Recipe must be either owned by user or public
        if (recipe.userId !== userId && !recipe.isPublic) {
          throw new Error(`You don't have access to recipe for day ${day.dayOfWeek}`);
        }
      }
    }
    
    // Check if plan exists
    const existingPlan = await ctx.db
      .query("weeklyPlans")
      .withIndex("by_user_and_week", (q) => 
        q.eq("userId", userId).eq("weekStartDate", args.weekStartDate)
      )
      .first();
    
    const now = Date.now();
    
    if (existingPlan) {
      // Update existing plan
      await ctx.db.patch(existingPlan._id, {
        days: args.days,
        updatedAt: now,
      });
      return existingPlan._id;
    } else {
      // Create new plan
      const planId = await ctx.db.insert("weeklyPlans", {
        userId,
        weekStartDate: args.weekStartDate,
        days: args.days,
        createdAt: now,
        updatedAt: now,
      });
      return planId;
    }
  },
});

// Remove recipe from a specific day
export const removeRecipeFromDay = mutation({
  args: {
    weekStartDate: v.number(),
    dayOfWeek: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    const plan = await ctx.db
      .query("weeklyPlans")
      .withIndex("by_user_and_week", (q) => 
        q.eq("userId", userId).eq("weekStartDate", args.weekStartDate)
      )
      .first();
    
    if (!plan) {
      throw new Error("Weekly plan not found");
    }
    
    const updatedDays = plan.days.map((day) =>
      day.dayOfWeek === args.dayOfWeek
        ? { ...day, recipeId: undefined }
        : day
    );
    
    await ctx.db.patch(plan._id, {
      days: updatedDays,
      updatedAt: Date.now(),
    });
    
    return plan._id;
  },
});

// List all weekly plans for the user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    
    const plans = await ctx.db
      .query("weeklyPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    
    // Count recipes for each plan
    const plansWithCounts = plans.map((plan) => {
      const recipeCount = plan.days.filter((day) => day.recipeId !== undefined).length;
      return {
        ...plan,
        recipeCount,
      };
    });
    
    return plansWithCounts;
  },
});

// Get a specific plan by ID
export const getById = query({
  args: { id: v.id("weeklyPlans") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    const plan = await ctx.db.get(args.id);
    
    if (!plan) {
      return null;
    }
    
    // Verify ownership
    if (plan.userId !== userId) {
      return null;
    }
    
    // Fetch recipe details for each day
    const daysWithRecipes = await Promise.all(
      plan.days.map(async (day) => {
        if (!day.recipeId) {
          return { ...day, recipeId: day.recipeId, recipe: null };
        }
        
        const recipe = await ctx.db.get(day.recipeId);
        if (!recipe) {
          return { ...day, recipeId: day.recipeId, recipe: null };
        }
        
        // Get image URL if exists
        const imageUrl = recipe.imageStorageId
          ? await ctx.storage.getUrl(recipe.imageStorageId)
          : null;
        
        return {
          ...day,
          recipeId: day.recipeId,
          recipe: {
            ...recipe,
            imageUrl,
            isOwnRecipe: recipe.userId === userId,
          },
        };
      })
    );
    
    return {
      ...plan,
      days: daysWithRecipes,
    };
  },
});

// Delete a weekly plan
export const remove = mutation({
  args: { id: v.id("weeklyPlans") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    const plan = await ctx.db.get(args.id);
    
    if (!plan) {
      throw new Error("Weekly plan not found");
    }
    
    // Verify ownership
    if (plan.userId !== userId) {
      throw new Error("You don't have permission to delete this plan");
    }
    
    await ctx.db.delete(args.id);
    
    return args.id;
  },
});

// Generate weekly plan using AI
export const generatePlan = action({
  args: {
    weekStartDate: v.number(),
    prompt: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"weeklyPlans">> => {
    const userId = await getUserId(ctx);

    try {
      // Generate weekly plan using AI service
      const aiPlan = await aiService.generateWeeklyPlan(args.prompt);

      // Create recipes for each day
      const recipeIds: Array<{ dayOfWeek: number; recipeId: Id<"recipes"> }> = [];

      for (const dayRecipe of aiPlan.recipes) {
        // Generate unique slug for AI-generated recipe
        const slug = await generateUniqueSlugInAction(ctx, dayRecipe.recipe.title);

        // Create recipe via mutation - AI-generated recipes are public by default
        const recipeId: Id<"recipes"> = await ctx.runMutation(createRecipeMutation, {
          title: dayRecipe.recipe.title,
          description: dayRecipe.recipe.description,
          cuisine: dayRecipe.recipe.cuisine,
          skillLevel: dayRecipe.recipe.skillLevel,
          cookTime: dayRecipe.recipe.cookTime,
          prepTime: dayRecipe.recipe.prepTime,
          cost: dayRecipe.recipe.cost,
          canFreeze: dayRecipe.recipe.canFreeze,
          canReheat: dayRecipe.recipe.canReheat,
          servings: dayRecipe.recipe.servings,
          ingredients: dayRecipe.recipe.ingredients.map(
            (ing) => `${ing.amount} ${ing.name}`
          ),
          steps: dayRecipe.recipe.steps,
          isPublic: true, // AI-generated recipes are public by default
          slug, // Auto-generate slug for AI recipes
        });

        recipeIds.push({
          dayOfWeek: dayRecipe.dayOfWeek,
          recipeId: recipeId,
        });
      }

      // Create weekly plan with all recipes
      const days = Array.from({ length: 7 }, (_, i) => {
        const dayRecipe = recipeIds.find((r) => r.dayOfWeek === i);
        return {
          dayOfWeek: i,
          recipeId: dayRecipe ? dayRecipe.recipeId : undefined,
        };
      });

      const planId: Id<"weeklyPlans"> = await ctx.runMutation(updateWeekMutation, {
        weekStartDate: args.weekStartDate,
        days,
      });

      return planId;
    } catch (error) {
      throw new Error(
        `Failed to generate weekly plan: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

// Generate shopping list from weekly plan
export const generateShoppingList = query({
  args: { planId: v.id("weeklyPlans") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Get plan and verify ownership
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== userId) {
      return null;
    }

    // Get all recipes from the plan
    const recipeIds = plan.days
      .filter((day) => day.recipeId !== undefined)
      .map((day) => day.recipeId!);

    if (recipeIds.length === 0) {
      return {
        items: [],
        totalItems: 0,
      };
    }

    // Fetch all ingredients for all recipes
    const allIngredients: Array<{
      name: string;
      amount: string;
      recipeTitle: string;
    }> = [];

    for (const recipeId of recipeIds) {
      const recipe = await ctx.db.get(recipeId);
      if (!recipe) continue;

      const ingredients = await ctx.db
        .query("ingredients")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
        .order("asc")
        .collect();

      for (const ingredient of ingredients) {
        allIngredients.push({
          name: ingredient.name,
          amount: ingredient.amount || "",
          recipeTitle: recipe.title,
        });
      }
    }

    // Aggregate and deduplicate ingredients
    const ingredientMap = new Map<
      string,
      { amounts: string[]; recipes: string[] }
    >();

    for (const ingredient of allIngredients) {
      const normalizedName = ingredient.name.toLowerCase().trim();
      const existing = ingredientMap.get(normalizedName);

      if (existing) {
        if (ingredient.amount) {
          existing.amounts.push(ingredient.amount);
        }
        if (!existing.recipes.includes(ingredient.recipeTitle)) {
          existing.recipes.push(ingredient.recipeTitle);
        }
      } else {
        ingredientMap.set(normalizedName, {
          amounts: ingredient.amount ? [ingredient.amount] : [],
          recipes: [ingredient.recipeTitle],
        });
      }
    }

    // Convert to array format
    const items = Array.from(ingredientMap.entries()).map(([name, data]) => {
      // Combine amounts if multiple
      const combinedAmount =
        data.amounts.length > 0 ? data.amounts.join(" + ") : "";

      return {
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
        amount: combinedAmount,
        recipes: data.recipes,
        recipeCount: data.recipes.length,
      };
    });

    // Sort alphabetically
    items.sort((a, b) => a.name.localeCompare(b.name));

    return {
      items,
      totalItems: items.length,
      planId: args.planId,
    };
  },
});

