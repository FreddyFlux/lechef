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
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"])
    .index("by_skill_level", ["skillLevel"])
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
});

