# Database Schema

Complete documentation of the leChef database schema.

## Schema Overview

The database uses Convex's NoSQL document store with a strongly-typed schema defined in `convex/schema.ts`.

## Tables

### recipes

User-created cooking recipes with rich metadata.

```typescript
recipes: defineTable({
  userId: v.string(),                    // Recipe owner
  title: v.string(),                     // Recipe title
  description: v.optional(v.string()),   // Optional description
  cuisine: v.string(),                   // Cuisine type (e.g., "Italian")
  skillLevel: v.string(),               // "beginner" | "intermediate" | "advanced"
  cookTime: v.number(),                  // Cooking time in minutes
  prepTime: v.number(),                  // Preparation time in minutes
  cost: v.string(),                      // "low" | "medium" | "high"
  canFreeze: v.boolean(),                // Can recipe be frozen?
  canReheat: v.boolean(),                 // Can recipe be reheated?
  servings: v.number(),                  // Number of servings
  createdAt: v.number(),                 // Timestamp
  updatedAt: v.number(),                 // Timestamp
})
  .index("by_user", ["userId"])
  .index("by_user_and_created", ["userId", "createdAt"])
  .index("by_cuisine", ["cuisine"])
  .index("by_skill_level", ["skillLevel"])
  .searchIndex("search_title", {
    searchField: "title",
    filterFields: ["cuisine", "skillLevel"],
  })
```

**Indexes:**
- `by_user`: Get all recipes for a user
- `by_user_and_created`: Get user's recipes sorted by creation date
- `by_cuisine`: Filter recipes by cuisine
- `by_skill_level`: Filter recipes by skill level
- `search_title`: Full-text search on recipe titles

### recipeSteps

Step-by-step instructions for recipes, separated into preparation and cooking steps.

```typescript
recipeSteps: defineTable({
  recipeId: v.id("recipes"),             // Parent recipe
  type: v.union(                          // Step type
    v.literal("preparation"),
    v.literal("cooking")
  ),
  stepNumber: v.number(),                 // Step number within type
  instruction: v.string(),                // Step instruction text
  order: v.number(),                      // Display order
})
  .index("by_recipe", ["recipeId"])
  .index("by_recipe_and_type", ["recipeId", "type"])
```

**Indexes:**
- `by_recipe`: Get all steps for a recipe
- `by_recipe_and_type`: Get steps filtered by type (preparation/cooking)

**Business Rules:**
- Preparation steps come before cooking steps
- Steps are ordered by their `order` field
- Steps are numbered within their type

### ingredients

Ingredient lists for recipes with amounts/measurements.

```typescript
ingredients: defineTable({
  recipeId: v.id("recipes"),              // Parent recipe
  name: v.string(),                      // Ingredient name
  amount: v.string(),                    // Amount/measurement (e.g., "2 cups")
  order: v.number(),                     // Display order
})
  .index("by_recipe", ["recipeId"])
```

**Indexes:**
- `by_recipe`: Get all ingredients for a recipe

**Business Rules:**
- Ingredients are ordered by their `order` field
- Amount is a string to support various formats (cups, tsp, etc.)

### comments

User comments on recipes.

```typescript
comments: defineTable({
  recipeId: v.id("recipes"),             // Recipe being commented on
  userId: v.string(),                    // User who left the comment
  content: v.string(),                   // Comment text
  createdAt: v.number(),                 // Timestamp
})
  .index("by_recipe", ["recipeId"])
  .index("by_user", ["userId"])
```

**Indexes:**
- `by_recipe`: Get all comments for a recipe
- `by_user`: Get all comments by a user

**Business Rules:**
- Comments trigger notifications for recipe owners
- Users can only edit/delete their own comments
- Comments persist even if recipe is deleted (soft delete)

### recipeLists

Custom lists created by users (e.g., "Favorites", "Meal Plan").

```typescript
recipeLists: defineTable({
  userId: v.string(),                    // List owner
  name: v.string(),                      // List name
  description: v.optional(v.string()),   // Optional description
  isPublic: v.boolean(),                 // Whether list is publicly visible
  createdAt: v.number(),                 // Timestamp
  updatedAt: v.number(),                 // Timestamp
})
  .index("by_user", ["userId"])
  .index("by_public", ["isPublic"])
```

**Indexes:**
- `by_user`: Get all lists for a user
- `by_public`: Get all public lists

**Business Rules:**
- Lists can be public or private
- Public lists can be browsed by all users
- Deleting a list removes all recipe associations

### listRecipes

Junction table linking recipes to lists.

```typescript
listRecipes: defineTable({
  listId: v.id("recipeLists"),           // Parent list
  recipeId: v.id("recipes"),             // Recipe in the list
  addedAt: v.number(),                   // Timestamp when added
})
  .index("by_list", ["listId"])
  .index("by_recipe", ["recipeId"])
  .index("by_list_and_recipe", ["listId", "recipeId"])
```

**Indexes:**
- `by_list`: Get all recipes in a list
- `by_recipe`: Get all lists containing a recipe
- `by_list_and_recipe`: Check if recipe is in list (unique constraint)

**Business Rules:**
- Same recipe can appear in multiple lists
- Removing from list doesn't delete the recipe
- Order can be managed (future feature)

### likes

User likes on recipes.

```typescript
likes: defineTable({
  recipeId: v.id("recipes"),             // Liked recipe
  userId: v.string(),                    // User who liked
  createdAt: v.number(),                 // Timestamp
})
  .index("by_recipe", ["recipeId"])
  .index("by_user", ["userId"])
  .index("by_recipe_and_user", ["recipeId", "userId"])
```

**Indexes:**
- `by_recipe`: Get all likes for a recipe (for count)
- `by_user`: Get all recipes liked by user
- `by_recipe_and_user`: Check if user has liked recipe (unique constraint)

**Business Rules:**
- One like per user per recipe
- Likes are counted for display
- Toggling like creates/deletes record

### notifications

Notifications for recipe owners when users comment or like.

```typescript
notifications: defineTable({
  userId: v.string(),                    // Recipe owner (notification recipient)
  type: v.union(                         // Notification type
    v.literal("comment"),
    v.literal("like")
  ),
  recipeId: v.id("recipes"),            // Related recipe
  commentId: v.optional(v.id("comments")), // Related comment (if type is "comment")
  read: v.boolean(),                    // Whether notification has been read
  createdAt: v.number(),                 // Timestamp
})
  .index("by_user", ["userId"])
  .index("by_user_and_read", ["userId", "read"])
```

**Indexes:**
- `by_user`: Get all notifications for a user
- `by_user_and_read`: Get unread notifications for a user

**Business Rules:**
- Created automatically when comment is added
- User can mark as read
- Notifications persist until deleted
- Only recipe owner receives notifications

## Relationships

### Recipe → Steps (1:N)
- One recipe has many steps
- Steps are ordered by type and order field

### Recipe → Ingredients (1:N)
- One recipe has many ingredients
- Ingredients are ordered by order field

### Recipe → Comments (1:N)
- One recipe has many comments
- Comments are ordered by creation date

### Recipe → Likes (1:N)
- One recipe has many likes
- Each user can like a recipe once

### Recipe List → Recipes (N:M via listRecipes)
- Lists contain many recipes
- Recipes can be in many lists

### User → Notifications (1:N)
- Users receive notifications for their recipes
- Notifications are filtered by read status

## Data Access Patterns

### Get Recipe with All Details

```typescript
// 1. Get recipe
const recipe = await ctx.db.get(recipeId);

// 2. Get steps
const steps = await ctx.db
  .query("recipeSteps")
  .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
  .order("asc")
  .collect();

// 3. Get ingredients
const ingredients = await ctx.db
  .query("ingredients")
  .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
  .order("asc")
  .collect();

// 4. Get comments
const comments = await ctx.db
  .query("comments")
  .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
  .order("desc")
  .collect();

// 5. Get like count
const likes = await ctx.db
  .query("likes")
  .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
  .collect();
```

### Get User's Recipes

```typescript
const recipes = await ctx.db
  .query("recipes")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .order("desc")
  .collect();
```

### Get Recipes in List

```typescript
// 1. Get list recipes
const listRecipes = await ctx.db
  .query("listRecipes")
  .withIndex("by_list", (q) => q.eq("listId", listId))
  .collect();

// 2. Get recipe details
const recipes = await Promise.all(
  listRecipes.map(lr => ctx.db.get(lr.recipeId))
);
```

### Get Unread Notifications

```typescript
const notifications = await ctx.db
  .query("notifications")
  .withIndex("by_user_and_read", (q) => 
    q.eq("userId", userId).eq("read", false)
  )
  .order("desc")
  .collect();
```

## Cascading Deletes

When deleting a recipe:
1. Delete all recipe steps
2. Delete all ingredients
3. Delete all comments (or soft delete)
4. Delete all likes
5. Delete all list associations
6. Delete all notifications related to recipe
7. Delete the recipe itself

## Future Schema Additions

### Planned Tables

- `recipeImages`: Store recipe images
- `recipeTags`: Flexible tagging system
- `recipeRatings`: Star ratings (1-5 stars)
- `recipeVariations`: Alternative versions of recipes
- `cookingSessions`: Track active cooking sessions
- `shoppingLists`: Shopping lists generated from recipes

### Planned Fields

- `recipes.imageUrl`: Recipe photo URL
- `recipes.videoUrl`: Cooking video URL
- `recipes.dietaryInfo`: Array of dietary tags
- `recipes.nutritionalInfo`: Nutritional facts object
- `recipeSteps.timer`: Timer duration for step
- `comments.parentId`: For nested replies

## Migration Strategy

When adding new fields:
1. Add field to schema with `v.optional()` for existing records
2. Update queries/mutations to handle optional fields
3. Migrate existing data if needed
4. Remove optional after migration complete

## Performance Considerations

### Index Usage
- Always use indexes for filtering
- Use compound indexes for common query patterns
- Avoid full table scans

### Query Optimization
- Limit results with `.take()`
- Use pagination for large datasets
- Batch related queries when possible

### Denormalization
- Consider denormalizing frequently accessed data
- Balance between query performance and data consistency
- Update denormalized fields when source changes

