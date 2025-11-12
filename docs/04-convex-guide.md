# Convex Backend Guide

This guide covers all aspects of working with Convex as the backend for leChef.

## What is Convex?

Convex is a backend-as-a-service that replaces:
- Traditional database (PostgreSQL, MongoDB, etc.)
- API layer (REST/GraphQL)
- Real-time subscriptions (WebSockets)
- Backend hosting

**Key Benefits:**
- Type-safe end-to-end
- Real-time by default
- Automatic caching and invalidation
- No boilerplate API code
- Built-in authentication integration

## Database Schema

The schema is defined in `convex/schema.ts`. See [Database Schema Documentation](./07-database-schema.md) for complete details.

### Index Strategy

**Primary Indexes:**
- `by_user`: Filter all user-specific data
- `by_recipe`: Get steps/ingredients for a recipe
- `by_list`: Get recipes in a list
- `by_recipe_and_user`: Get user's like on a recipe

**Compound Indexes:**
- `by_user_and_read`: Find user's unread notifications
- `by_recipe_and_type`: Get steps by type (preparation/cooking)
- `by_list_and_recipe`: Check if recipe is in list

**Search Indexes:**
- `search_title`: Full-text search on recipe titles

## Queries (Read Operations)

### Basic Query Pattern

```typescript
// convex/recipes.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // 1. Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty for unauthenticated
    }
    
    // 2. Query with index
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc") // Most recent first
      .collect();
    
    return recipes;
  },
});
```

### Query by ID with Ownership Check

```typescript
export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const recipe = await ctx.db.get(args.id);
    
    // Verify ownership
    if (!recipe || recipe.userId !== identity.subject) {
      return null;
    }
    
    return recipe;
  },
});
```

### Query with Relationships

```typescript
export const getWithDetails = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    // Get recipe
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe || recipe.userId !== identity.subject) {
      return null;
    }
    
    // Get related steps
    const steps = await ctx.db
      .query("recipeSteps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .order("asc")
      .collect();
    
    // Get ingredients
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

### Search Query

```typescript
export const search = query({
  args: {
    query: v.string(),
    cuisine: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Full-text search
    let results = await ctx.db
      .query("recipes")
      .withSearchIndex("search_title", (q) => 
        q.search("title", args.query)
      )
      .collect();
    
    // Additional filtering
    if (args.cuisine) {
      results = results.filter(
        (recipe) => recipe.cuisine === args.cuisine
      );
    }
    
    return results;
  },
});
```

## Mutations (Write Operations)

### Create Mutation

```typescript
// convex/recipes.ts
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
    // 1. Authenticate (throw if not authenticated)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    // 2. Validate input
    if (args.title.length < 3) {
      throw new Error("Title must be at least 3 characters");
    }
    
    // 3. Create record
    const recipeId = await ctx.db.insert("recipes", {
      userId,
      title: args.title,
      description: args.description,
      cuisine: args.cuisine,
      skillLevel: args.skillLevel,
      cookTime: args.cookTime,
      prepTime: args.prepTime,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 4. Return ID
    return recipeId;
  },
});
```

### Update Mutation

```typescript
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
      throw new Error("Not authorized to update this recipe");
    }
    
    // Validate updates
    if (args.title && args.title.length < 3) {
      throw new Error("Title must be at least 3 characters");
    }
    
    // Apply updates
    await ctx.db.patch(args.id, {
      ...(args.title !== undefined && { title: args.title }),
      ...(args.description !== undefined && { description: args.description }),
      updatedAt: Date.now(),
    });
    
    return args.id;
  },
});
```

### Delete Mutation with Cascade

```typescript
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
    
    // Cascade delete steps
    const steps = await ctx.db
      .query("recipeSteps")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();
    
    for (const step of steps) {
      await ctx.db.delete(step._id);
    }
    
    // Cascade delete ingredients
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

### Complex Business Logic Mutation

```typescript
// Add comment and create notification
export const addComment = mutation({
  args: {
    recipeId: v.id("recipes"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const userId = identity.subject;
    
    // Get recipe to find owner
    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    
    // Create comment
    const commentId = await ctx.db.insert("comments", {
      recipeId: args.recipeId,
      userId,
      content: args.content,
      createdAt: Date.now(),
    });
    
    // Create notification for recipe owner (if not commenting on own recipe)
    if (recipe.userId !== userId) {
      await ctx.db.insert("notifications", {
        userId: recipe.userId,
        type: "comment",
        recipeId: args.recipeId,
        commentId,
        read: false,
        createdAt: Date.now(),
      });
    }
    
    return commentId;
  },
});
```

## Actions (External Integrations)

Actions are used for non-deterministic operations like calling external APIs.

```typescript
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Example: Generate recipe using AI
export const generateRecipe = action({
  args: {
    cuisine: v.string(),
    dietaryRestrictions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // 2. Call external API
    const response = await fetch("https://api.example.com/generate-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    
    if (!response.ok) {
      throw new Error("Failed to generate recipe");
    }
    
    const generatedRecipe = await response.json();
    
    // 3. Use mutation to save data
    const recipeId = await ctx.runMutation(api.recipes.create, {
      title: generatedRecipe.title,
      description: generatedRecipe.description,
      cuisine: args.cuisine,
    });
    
    return recipeId;
  },
});
```

## Authentication Helper

Create reusable auth helper:

```typescript
// convex/auth.ts
import { Auth } from "convex/server";

export async function getUserId(ctx: { auth: Auth }): Promise<string> {
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

Use in mutations:

```typescript
import { getUserId } from "./auth";

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx); // Throws if not authenticated
    
    const recipeId = await ctx.db.insert("recipes", {
      userId,
      title: args.title,
      createdAt: Date.now(),
    });
    
    return recipeId;
  },
});
```

## Client-Side Usage

### Using Queries

```typescript
"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function RecipeList() {
  // Automatically subscribes to real-time updates
  const recipes = useQuery(api.recipes.list);
  
  // recipes is undefined while loading
  if (recipes === undefined) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {recipes.map(recipe => (
        <div key={recipe._id}>{recipe.title}</div>
      ))}
    </div>
  );
}
```

### Using Mutations

```typescript
"use client"

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export function CreateRecipeForm() {
  const [title, setTitle] = useState("");
  const createRecipe = useMutation(api.recipes.create);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const recipeId = await createRecipe({ title, cuisine: "Italian" });
      console.log("Created recipe:", recipeId);
      setTitle(""); // Reset form
    } catch (error) {
      console.error("Failed to create recipe:", error);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
      />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Conditional Queries

```typescript
"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function RecipeDetail({ recipeId }: { recipeId: string | null }) {
  // Skip query if no recipeId
  const recipe = useQuery(
    api.recipes.getById,
    recipeId ? { id: recipeId } : "skip"
  );
  
  if (!recipeId) return <div>Select a recipe</div>;
  if (recipe === undefined) return <div>Loading...</div>;
  if (recipe === null) return <div>Not found</div>;
  
  return <div>{recipe.title}</div>;
}
```

## Performance Optimization

### Use Indexes

```typescript
// ✅ Good - Uses index
const recipes = await ctx.db
  .query("recipes")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();

// ❌ Bad - Full table scan
const recipes = await ctx.db
  .query("recipes")
  .filter((q) => q.eq(q.field("userId"), userId))
  .collect();
```

### Limit Results

```typescript
// Get only recent recipes
const recentRecipes = await ctx.db
  .query("recipes")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .order("desc")
  .take(10); // Limit to 10
```

### Pagination

```typescript
import { paginationOptsValidator } from "convex/server";

export const listPaginated = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    return await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

## Error Handling

### In Queries
- Return `null` for not found
- Return `[]` for empty lists
- Don't throw errors (queries should be pure)

### In Mutations
- Throw descriptive errors
- Use Error constructor
- Client can catch and display

```typescript
if (!recipe) {
  throw new Error("Recipe not found");
}

if (recipe.userId !== userId) {
  throw new Error("Not authorized");
}
```

## Deployment

### Push Schema Changes

```bash
npx convex dev  # Development
npx convex deploy  # Production
```

### View Dashboard

Visit [dashboard.convex.dev](https://dashboard.convex.dev) to:
- View function logs
- Query database directly
- Monitor performance
- Manage deployments

