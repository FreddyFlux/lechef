import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return empty array if not authenticated
      // This allows the UI to work while auth is being configured
      return [];
    }
    
    const userId = identity.subject;
    return await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    cuisine: v.array(v.string()),
    skillLevel: v.string(),
    cookTime: v.number(),
    prepTime: v.number(),
    cost: v.string(),
    canFreeze: v.boolean(),
    canReheat: v.boolean(),
    servings: v.number(),
    ingredients: v.optional(v.array(v.string())),
    steps: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    const now = Date.now();
    const recipeId = await ctx.db.insert("recipes", {
      userId,
      title: args.title,
      description: args.description,
      cuisine: args.cuisine,
      skillLevel: args.skillLevel,
      cookTime: args.cookTime,
      prepTime: args.prepTime,
      cost: args.cost,
      canFreeze: args.canFreeze,
      canReheat: args.canReheat,
      servings: args.servings,
      createdAt: now,
      updatedAt: now,
    });
    
    // Insert ingredients
    if (args.ingredients && args.ingredients.length > 0) {
      for (let i = 0; i < args.ingredients.length; i++) {
        await ctx.db.insert("ingredients", {
          recipeId,
          name: args.ingredients[i],
          amount: "",
          order: i,
        });
      }
    }
    
    // Insert cooking steps
    if (args.steps && args.steps.length > 0) {
      for (let i = 0; i < args.steps.length; i++) {
        await ctx.db.insert("recipeSteps", {
          recipeId,
          type: "cooking",
          stepNumber: i + 1,
          instruction: args.steps[i],
          order: i,
        });
      }
    }
    
    return recipeId;
  },
});

