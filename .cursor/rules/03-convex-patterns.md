# Convex Patterns and Best Practices

## Convex Architecture Overview

Convex replaces traditional backend infrastructure:
- **Database**: NoSQL document database
- **Backend Functions**: Queries, mutations, and actions
- **Real-time Subscriptions**: Automatic UI updates
- **Authentication**: Integrated with Clerk

## File Structure

```
convex/
├── _generated/              # Auto-generated (don't edit)
│   ├── api.d.ts
│   ├── dataModel.d.ts
│   └── server.ts
├── schema.ts                # Database schema
├── recipes.ts               # Recipe queries & mutations
├── comments.ts              # Comment queries & mutations
├── recipeLists.ts           # Recipe list queries & mutations
├── notifications.ts         # Notification queries & mutations
└── auth.ts                  # Auth helper functions
```

## Schema Definition

### Define Schema in `convex/schema.ts`
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  recipes: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    cuisine: v.string(),
    skillLevel: v.string(),
    cookTime: v.number(), // minutes
    prepTime: v.number(), // minutes
    cost: v.string(), // "low", "medium", "high"
    canFreeze: v.boolean(),
    canReheat: v.boolean(),
    servings: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"])
    .index("by_cuisine", ["cuisine"])
    .index("by_skill_level", ["skillLevel"]),
  
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
    amount: v.string(), // e.g., "2 cups", "1 tsp"
    order: v.number(),
  })
    .index("by_recipe", ["recipeId"]),
  
  comments: defineTable({
    recipeId: v.id("recipes"),
    userId: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_user", ["userId"]),
  
  recipeLists: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),
  
  listRecipes: defineTable({
    listId: v.id("recipeLists"),
    recipeId: v.id("recipes"),
    addedAt: v.number(),
  })
    .index("by_list", ["listId"])
    .index("by_recipe", ["recipeId"]),
  
  likes: defineTable({
    recipeId: v.id("recipes"),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_user", ["userId"])
    .index("by_recipe_and_user", ["recipeId", "userId"]),
  
  notifications: defineTable({
    userId: v.string(), // Recipe owner
    type: v.union(v.literal("comment"), v.literal("like")),
    recipeId: v.id("recipes"),
    commentId: v.optional(v.id("comments")),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"]),
});
```

### Indexes
- Create indexes for common query patterns
- Always index by `userId` for user-specific data
- Index by foreign keys for joins
- Consider compound indexes for common filters

## Queries

### Query Structure
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const userId = identity.subject;
    
    // Query database
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    
    return recipes;
  },
});

export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const recipe = await ctx.db.get(args.id);
    
    // Ensure user owns this resource (or it's public)
    if (!recipe || recipe.userId !== identity.subject) {
      return null;
    }
    
    return recipe;
  },
});
```

### Query Best Practices
1. **Always authenticate**: Check `ctx.auth.getUserIdentity()` first
2. **Filter by userId**: Ensure users only see their own data (unless public)
3. **Use indexes**: Leverage indexes for performance
4. **Return null for not found**: Don't throw errors in queries
5. **Keep queries pure**: No side effects, no mutations

## Mutations

### Mutation Structure
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    cuisine: v.string(),
    skillLevel: v.string(),
    cookTime: v.number(),
    prepTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Validation (additional to Zod)
    if (args.title.length < 3) {
      throw new Error("Title must be at least 3 characters");
    }
    
    // Create record
    const recipeId = await ctx.db.insert("recipes", {
      userId: identity.subject,
      title: args.title,
      description: args.description,
      cuisine: args.cuisine,
      skillLevel: args.skillLevel,
      cookTime: args.cookTime,
      prepTime: args.prepTime,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return recipeId;
  },
});

export const update = mutation({
  args: {
    id: v.id("recipes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Get existing record
    const recipe = await ctx.db.get(args.id);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    
    // Verify ownership
    if (recipe.userId !== identity.subject) {
      throw new Error("Not authorized");
    }
    
    // Update record
    await ctx.db.patch(args.id, {
      ...(args.title && { title: args.title }),
      ...(args.description !== undefined && { description: args.description }),
      updatedAt: Date.now(),
    });
    
    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const recipe = await ctx.db.get(args.id);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    
    if (recipe.userId !== identity.subject) {
      throw new Error("Not authorized");
    }
    
    // Delete related records (cascade)
    const steps = await ctx.db
      .query("recipeSteps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();
    
    for (const step of steps) {
      await ctx.db.delete(step._id);
    }
    
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();
    
    for (const ingredient of ingredients) {
      await ctx.db.delete(ingredient._id);
    }
    
    // Delete main record
    await ctx.db.delete(args.id);
  },
});
```

### Mutation Best Practices
1. **Always authenticate**: Check user identity first
2. **Validate inputs**: Use both Convex validators and runtime checks
3. **Verify ownership**: Ensure user owns the resource being modified
4. **Handle relationships**: Manually cascade deletes if needed
5. **Throw errors**: Use descriptive error messages for failures
6. **Return IDs**: Return created/updated IDs for client use

## Actions

### When to Use Actions
- Calling third-party APIs
- Sending emails
- Complex computations
- Non-deterministic operations

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";

export const generateRecipe = action({
  args: {
    cuisine: v.string(),
    dietaryRestrictions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Actions can call external APIs
    const response = await fetch("https://api.example.com/generate-recipe", {
      method: "POST",
      body: JSON.stringify(args),
    });
    
    const recipe = await response.json();
    
    // Actions can call mutations
    const recipeId = await ctx.runMutation(api.recipes.create, {
      title: recipe.title,
      description: recipe.description,
      cuisine: args.cuisine,
    });
    
    return recipeId;
  },
});
```

## Authentication with Clerk

### Setup Auth Helper
```typescript
// convex/auth.ts
import { Auth } from "convex/server";

export async function getUserId(ctx: { auth: Auth }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

export async function requireAuth(ctx: { auth: Auth }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}
```

### Use in Queries/Mutations
```typescript
import { getUserId } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    
    return await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});
```

## Pagination

### Paginated Queries
```typescript
import { paginationOptsValidator } from "convex/server";

export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    const result = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
    
    return result;
  },
});
```

## Relationships

### Loading Related Data
```typescript
export const getWithDetails = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.userId !== userId) {
      return null;
    }
    
    const steps = await ctx.db
      .query("recipeSteps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .order("asc")
      .collect();
    
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .order("asc")
      .collect();
    
    return {
      ...recipe,
      steps,
      ingredients,
    };
  },
});
```

## Error Handling

### In Queries
```typescript
export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    try {
      const userId = await getUserId(ctx);
      const recipe = await ctx.db.get(args.id);
      
      if (!recipe || recipe.userId !== userId) {
        return null; // Return null, don't throw
      }
      
      return recipe;
    } catch (error) {
      console.error("Error fetching recipe:", error);
      return null;
    }
  },
});
```

### In Mutations
```typescript
export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx); // This throws if not authenticated
    
    if (args.title.length < 3) {
      throw new Error("Title must be at least 3 characters");
    }
    
    const recipeId = await ctx.db.insert("recipes", {
      userId,
      title: args.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return recipeId;
  },
});
```

## Performance Optimization

### Use Indexes Effectively
```typescript
// ✅ Good - Uses index
const recipes = await ctx.db
  .query("recipes")
  .withIndex("by_cuisine", (q) => q.eq("cuisine", cuisine))
  .collect();

// ❌ Bad - Full table scan
const recipes = await ctx.db
  .query("recipes")
  .filter((q) => q.eq(q.field("cuisine"), cuisine))
  .collect();
```

### Limit Results
```typescript
// Get only what you need
const recentRecipes = await ctx.db
  .query("recipes")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .order("desc")
  .take(10); // Only take 10 most recent
```

### Avoid N+1 Queries
```typescript
// ✅ Good - Batch load
const ingredients = await ctx.db
  .query("ingredients")
  .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
  .collect();

// ❌ Bad - N+1 queries in client
// Don't fetch ingredients one by one from the client
```

