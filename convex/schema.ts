import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  recipes: defineTable({
    userId: v.string(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
    slug: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    imageStorageId: v.optional(v.id("_storage")),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"])
    .index("by_skill_level", ["skillLevel"])
    .index("by_slug", ["slug"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["skillLevel"],
    }),
  
  recipeSteps: defineTable({
    recipeId: v.id("recipes"),
    type: v.union(v.literal("preparation"), v.literal("cooking")),
    stepNumber: v.number(),
    instruction: v.string(),
    order: v.number(),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_recipe_and_type", ["recipeId", "type"]),
  
  ingredients: defineTable({
    recipeId: v.id("recipes"),
    name: v.string(),
    amount: v.string(),
    order: v.number(),
  })
    .index("by_recipe", ["recipeId"]),
  
  weeklyPlans: defineTable({
    userId: v.string(),
    weekStartDate: v.number(), // Timestamp for the start of the week (Monday)
    days: v.array(v.object({
      dayOfWeek: v.number(), // 0 = Monday, 6 = Sunday
      recipeId: v.optional(v.id("recipes")),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_week", ["userId", "weekStartDate"]),
});

