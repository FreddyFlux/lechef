import { query, mutation, action } from "./_generated/server";
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

export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    const userId = identity.subject;
    const recipe = await ctx.db.get(args.id);
    
    // Verify ownership
    if (!recipe || recipe.userId !== userId) {
      return null;
    }
    
    // Get ingredients
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .order("asc")
      .collect();
    
    // Get cooking steps
    const steps = await ctx.db
      .query("recipeSteps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .order("asc")
      .collect();
    
    // Get image URL if exists
    const imageUrl = recipe.imageStorageId
      ? await ctx.storage.getUrl(recipe.imageStorageId)
      : null;
    
    return {
      ...recipe,
      ingredients,
      steps,
      imageUrl,
    };
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
    imageStorageId: v.optional(v.id("_storage")),
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
      imageStorageId: args.imageStorageId,
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

export const update = mutation({
  args: {
    id: v.id("recipes"),
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
    imageStorageId: v.optional(v.id("_storage")),
    removeImage: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    // Verify ownership
    const recipe = await ctx.db.get(args.id);
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Recipe not found or you don't have permission to edit it");
    }
    
    // Handle image updates
    // Delete old image if being replaced or removed
    if (recipe.imageStorageId) {
      const shouldDeleteOldImage = 
        args.removeImage === true || // Image is being explicitly removed
        (args.imageStorageId !== undefined && args.imageStorageId !== recipe.imageStorageId); // Image is being replaced
      
      if (shouldDeleteOldImage) {
        try {
          await ctx.storage.delete(recipe.imageStorageId);
        } catch (error) {
          // Log but don't fail if image deletion fails
          console.error("Failed to delete old image:", error);
        }
      }
    }
    
    // Update recipe
    const now = Date.now();
    const updateData: any = {
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
      updatedAt: now,
    };
    
    // Handle image update: if removeImage is true, clear it; if imageStorageId is provided, update it; otherwise preserve existing
    if (args.removeImage === true) {
      // Clear the image field
      updateData.imageStorageId = undefined;
    } else if (args.imageStorageId !== undefined) {
      // Set new image
      updateData.imageStorageId = args.imageStorageId;
    }
    // If both are undefined, don't include it in update (preserves existing)
    
    await ctx.db.patch(args.id, updateData);
    
    // Delete existing ingredients
    const existingIngredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();
    
    for (const ingredient of existingIngredients) {
      await ctx.db.delete(ingredient._id);
    }
    
    // Insert new ingredients
    if (args.ingredients && args.ingredients.length > 0) {
      for (let i = 0; i < args.ingredients.length; i++) {
        await ctx.db.insert("ingredients", {
          recipeId: args.id,
          name: args.ingredients[i],
          amount: "",
          order: i,
        });
      }
    }
    
    // Delete existing steps
    const existingSteps = await ctx.db
      .query("recipeSteps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();
    
    for (const step of existingSteps) {
      await ctx.db.delete(step._id);
    }
    
    // Insert new cooking steps
    if (args.steps && args.steps.length > 0) {
      for (let i = 0; i < args.steps.length; i++) {
        await ctx.db.insert("recipeSteps", {
          recipeId: args.id,
          type: "cooking",
          stepNumber: i + 1,
          instruction: args.steps[i],
          order: i,
        });
      }
    }
    
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    // Verify ownership
    const recipe = await ctx.db.get(args.id);
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Recipe not found or you don't have permission to delete it");
    }
    
    // Delete associated image if exists
    if (recipe.imageStorageId) {
      try {
        await ctx.storage.delete(recipe.imageStorageId);
      } catch (error) {
        // Log but don't fail if image deletion fails
        console.error("Failed to delete recipe image:", error);
      }
    }
    
    // Delete all related ingredients
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();
    
    for (const ingredient of ingredients) {
      await ctx.db.delete(ingredient._id);
    }
    
    // Delete all related recipe steps
    const steps = await ctx.db
      .query("recipeSteps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();
    
    for (const step of steps) {
      await ctx.db.delete(step._id);
    }
    
    // Delete the recipe itself
    await ctx.db.delete(args.id);
    
    return args.id;
  },
});

export const checkSlugExists = query({
  args: { 
    slug: v.string(),
    excludeRecipeId: v.optional(v.id("recipes")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("recipes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    // If no existing recipe found, slug is available
    if (!existing) {
      return false;
    }
    
    // If excluding a recipe ID and it matches, slug is available (for editing)
    if (args.excludeRecipeId && existing._id === args.excludeRecipeId) {
      return false;
    }
    
    // Otherwise, slug exists
    return true;
  },
});

export const shareRecipe = mutation({
  args: {
    id: v.id("recipes"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    // Verify ownership
    const recipe = await ctx.db.get(args.id);
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Recipe not found or you don't have permission to share it");
    }
    
    // Check if slug already exists (excluding current recipe)
    const existing = await ctx.db
      .query("recipes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existing && existing._id !== args.id) {
      throw new Error("A recipe with this slug already exists. Please choose a different name.");
    }
    
    // Update recipe to be public with slug
    await ctx.db.patch(args.id, {
      slug: args.slug,
      isPublic: true,
      updatedAt: Date.now(),
    });
    
    return args.id;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const recipe = await ctx.db
      .query("recipes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    // Only return if recipe is public
    if (!recipe || !recipe.isPublic) {
      return null;
    }
    
    // Get ingredients
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
      .order("asc")
      .collect();
    
    // Get cooking steps
    const steps = await ctx.db
      .query("recipeSteps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
      .order("asc")
      .collect();
    
    // Get image URL if exists
    const imageUrl = recipe.imageStorageId
      ? await ctx.storage.getUrl(recipe.imageStorageId)
      : null;
    
    return {
      ...recipe,
      ingredients,
      steps,
      imageUrl,
    };
  },
});

// Generate upload URL for image upload
export const generateUploadUrl = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Delete image from storage
export const deleteImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await getUserId(ctx);
    await ctx.storage.delete(args.storageId);
  },
});

// Search recipes - returns both public recipes and user's own recipes
export const search = query({
  args: { 
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    const userId = identity.subject;
    const limit = args.limit || 50;
    
    // Get user's own recipes
    const ownRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    // Get all public recipes
    const allRecipes = await ctx.db.query("recipes").collect();
    const publicRecipes = allRecipes.filter(
      (recipe) => recipe.isPublic === true && recipe.userId !== userId
    );
    
    // Combine and deduplicate (in case user has public recipes)
    const recipeMap = new Map();
    
    // Add own recipes first (so they take precedence)
    for (const recipe of ownRecipes) {
      recipeMap.set(recipe._id, recipe);
    }
    
    // Add public recipes
    for (const recipe of publicRecipes) {
      if (!recipeMap.has(recipe._id)) {
        recipeMap.set(recipe._id, recipe);
      }
    }
    
    let results = Array.from(recipeMap.values());
    
    // Filter by search query if provided
    if (args.searchQuery && args.searchQuery.trim()) {
      const queryLower = args.searchQuery.toLowerCase().trim();
      results = results.filter((recipe) => {
        const titleMatch = recipe.title.toLowerCase().includes(queryLower);
        const descriptionMatch = recipe.description?.toLowerCase().includes(queryLower);
        const cuisineMatch = recipe.cuisine.some((c: string) => 
          c.toLowerCase().includes(queryLower)
        );
        return titleMatch || descriptionMatch || cuisineMatch;
      });
    }
    
    // Limit results
    results = results.slice(0, limit);
    
    // Get image URLs for all recipes
    const resultsWithImages = await Promise.all(
      results.map(async (recipe) => {
        const imageUrl = recipe.imageStorageId
          ? await ctx.storage.getUrl(recipe.imageStorageId)
          : null;
        
        return {
          ...recipe,
          imageUrl,
          isOwnRecipe: recipe.userId === userId,
        };
      })
    );
    
    return resultsWithImages;
  },
});

