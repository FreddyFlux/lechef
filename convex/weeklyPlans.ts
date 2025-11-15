import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./auth";

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
        _id: null as any,
        userId,
        weekStartDate: weekStart,
        days: Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          recipeId: undefined as any,
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
        _id: null as any,
        userId,
        weekStartDate: args.weekStartDate,
        days: Array.from({ length: 7 }, (_, i) => ({
          dayOfWeek: i,
          recipeId: undefined as any,
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

