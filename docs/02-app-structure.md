# App Structure and Domain Model

## Domain Overview

leChef manages the complete lifecycle of recipe creation, sharing, engagement, and organization. The domain model consists of several interconnected entities focused on cooking recipes and user interaction.

## Domain Entities

### 1. Recipe
A cooking recipe created by a user with rich metadata and step-by-step instructions.

**Properties:**
- `id`: Unique identifier
- `userId`: Owner of the recipe
- `title`: Recipe title (e.g., "Chicken Curry")
- `description`: Optional description of the recipe
- `cuisine`: Type of cuisine (e.g., "Italian", "Asian", "Mexican")
- `skillLevel`: Difficulty level ("beginner", "intermediate", "advanced")
- `cookTime`: Cooking time in minutes
- `prepTime`: Preparation time in minutes
- `cost`: Cost level ("low", "medium", "high")
- `canFreeze`: Whether recipe can be frozen
- `canReheat`: Whether recipe can be reheated
- `servings`: Number of servings
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Business Rules:**
- User can create multiple recipes
- Recipes can be public (shared) or private
- Deleting a recipe cascades to its steps, ingredients, and comments
- Recipes can be liked and saved to lists by other users

### 2. Recipe Step
A single instruction step in a recipe, either preparation or cooking.

**Properties:**
- `id`: Unique identifier
- `recipeId`: Parent recipe
- `type`: "preparation" or "cooking"
- `stepNumber`: Step number within type
- `instruction`: Step instruction text
- `order`: Display order

**Business Rules:**
- Each step belongs to exactly one recipe
- Preparation steps come before cooking steps
- Steps are ordered by their `order` field
- Steps can be edited or reordered

### 3. Ingredient
An ingredient in a recipe with amount/measurement.

**Properties:**
- `id`: Unique identifier
- `recipeId`: Parent recipe
- `name`: Ingredient name (e.g., "Chicken breast")
- `amount`: Amount/measurement (e.g., "2 cups", "1 tsp")
- `order`: Display order

**Business Rules:**
- Each ingredient belongs to exactly one recipe
- Ingredients are ordered by their `order` field
- Ingredients can be edited or reordered

### 4. Comment
A user comment on a recipe.

**Properties:**
- `id`: Unique identifier
- `recipeId`: Recipe being commented on
- `userId`: User who left the comment
- `content`: Comment text
- `createdAt`: Timestamp

**Business Rules:**
- Comments belong to recipes
- Recipe owner gets notified when comment is added
- Users can only edit/delete their own comments
- Comments persist even if recipe is deleted (soft delete)

### 5. Recipe List
A custom list created by a user (e.g., "Favorites", "Meal Plan", "Weekend Cooking").

**Properties:**
- `id`: Unique identifier
- `userId`: Owner of the list
- `name`: List name
- `description`: Optional description
- `isPublic`: Whether list is publicly visible
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Business Rules:**
- User can create multiple lists
- Lists can be public or private
- Deleting a list removes all recipe associations
- Lists can contain recipes from any user (if public)

### 6. List Recipe
Links a recipe to a recipe list.

**Properties:**
- `id`: Unique identifier
- `listId`: Parent list
- `recipeId`: Recipe in the list
- `addedAt`: Timestamp when added

**Business Rules:**
- Same recipe can appear in multiple lists
- Removing from list doesn't delete the recipe
- Order can be managed (future feature)

### 7. Like
A user's like on a recipe.

**Properties:**
- `id`: Unique identifier
- `recipeId`: Liked recipe
- `userId`: User who liked
- `createdAt`: Timestamp

**Business Rules:**
- User can like/unlike recipes
- One like per user per recipe
- Likes are counted for display

### 8. Notification
A notification for a recipe owner when someone comments.

**Properties:**
- `id`: Unique identifier
- `userId`: Recipe owner (notification recipient)
- `type`: "comment" or "like"
- `recipeId`: Related recipe
- `commentId`: Related comment (if type is "comment")
- `read`: Whether notification has been read
- `createdAt`: Timestamp

**Business Rules:**
- Created automatically when comment is added
- User can mark as read
- Notifications persist until deleted
- Only recipe owner receives notifications

## Entity Relationships

```
┌─────────────────┐
│     Recipe      │ (User owned)
│  - id           │
│  - userId       │
│  - title        │
│  - cuisine      │
│  - skillLevel   │
└────────┬────────┘
         │ 1:N
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  Recipe Step    │  │   Ingredient    │
│  - id           │  │  - id           │
│  - recipeId     │  │  - recipeId     │
│  - type         │  │  - name         │
│  - instruction  │  │  - amount       │
└─────────────────┘  └─────────────────┘
         │
         │ N:1
         │
         ▼
┌─────────────────┐
│    Comment      │
│  - id           │
│  - recipeId     │
│  - userId        │
│  - content      │
└────────┬────────┘
         │
         │ Creates
         │
         ▼
┌─────────────────┐
│  Notification   │
│  - id           │
│  - userId        │ (Recipe owner)
│  - type         │
│  - read         │
└─────────────────┘

┌─────────────────┐
│   Recipe List   │ (User owned)
│  - id           │
│  - userId       │
│  - name         │
│  - isPublic     │
└────────┬────────┘
         │ 1:N
         │
         ▼
┌─────────────────┐
│   List Recipe   │
│  - id           │
│  - listId       │
│  - recipeId     │────┐
└─────────────────┘    │
                       │ N:1
                       ▼
                ┌─────────────┐
                │   Recipe    │
                └─────────────┘
                       ▲
                       │ N:1
                       │
┌─────────────────┐    │
│      Like       │────┘
│  - id           │
│  - recipeId     │
│  - userId        │
└─────────────────┘
```

## User Workflows

### 1. Create Recipe

```
User creates recipe
    ↓
Specifies: title, cuisine, skill level, times, cost
    ↓
Adds ingredients with amounts
    ↓
Adds preparation steps
    ↓
Adds cooking steps
    ↓
Recipe created and saved
```

### 2. View Recipe

```
User opens recipe
    ↓
Views recipe metadata (cuisine, skill, time, cost)
    ↓
Views ingredient list
    ↓
Follows step-by-step instructions:
  - Preparation steps first
  - Then cooking steps
    ↓
Can like, comment, or save to list
```

### 3. Comment on Recipe

```
User views recipe
    ↓
Clicks "Add Comment"
    ↓
Enters comment text
    ↓
Submits comment
    ↓
Comment saved
    ↓
Recipe owner receives notification
```

### 4. Create Recipe List

```
User creates list
    ↓
Specifies: name, description, public/private
    ↓
List created
    ↓
User can add recipes to list
    ↓
List can be shared (if public)
```

### 5. Save Recipe to List

```
User views recipe
    ↓
Clicks "Save to List"
    ↓
Selects list (or creates new)
    ↓
Recipe added to list
    ↓
Recipe appears in list
```

## Application States

### Global State
- **Authenticated User**: Clerk provides userId
- **Theme**: Light/Dark mode preference
- **Notifications**: Unread notification count

### Page-Level State

#### Recipes Page
- List of recipes
- Filter/sort options (cuisine, skill level, etc.)
- Search query

#### Recipe Detail Page
- Recipe information
- Ingredients list
- Step-by-step instructions
- Comments section
- Like/save actions

#### Lists Page
- User's recipe lists
- Public lists (if browsing)
- Create list action

#### List Detail Page
- List information
- Recipes in list
- Add/remove recipe actions

#### Notifications Page
- Unread notifications
- Read notifications
- Mark as read actions

## Data Access Patterns

### Reading Data

**User's Recipes:**
```typescript
db.query("recipes")
  .withIndex("by_user", q => q.eq("userId", userId))
  .order("desc")
  .collect()
```

**Recipe with Details:**
```typescript
const recipe = await db.get(recipeId);
const steps = await db
  .query("recipeSteps")
  .withIndex("by_recipe", q => q.eq("recipeId", recipeId))
  .order("asc")
  .collect();
const ingredients = await db
  .query("ingredients")
  .withIndex("by_recipe", q => q.eq("recipeId", recipeId))
  .order("asc")
  .collect();
```

**Comments on Recipe:**
```typescript
db.query("comments")
  .withIndex("by_recipe", q => q.eq("recipeId", recipeId))
  .order("desc")
  .collect()
```

**User's Lists:**
```typescript
db.query("recipeLists")
  .withIndex("by_user", q => q.eq("userId", userId))
  .order("desc")
  .collect()
```

### Writing Data

**Creating Entities:**
- Always set `userId` for user-owned resources
- Set timestamps (`createdAt`, `updatedAt`)
- Validate with Zod before mutation

**Updating Entities:**
- Verify ownership before update
- Update `updatedAt` timestamp
- Use atomic operations (Convex handles this)

**Deleting Entities:**
- Verify ownership before delete
- Cascade deletes manually (Convex doesn't auto-cascade)
- Consider soft deletes for important data (comments)

## Business Logic

### Notification Creation
```typescript
// When comment is created
async function createComment(recipeId: string, content: string) {
  const commentId = await db.insert("comments", {
    recipeId,
    userId: currentUserId,
    content,
    createdAt: Date.now(),
  });
  
  // Get recipe owner
  const recipe = await db.get(recipeId);
  
  // Create notification for recipe owner
  if (recipe && recipe.userId !== currentUserId) {
    await db.insert("notifications", {
      userId: recipe.userId,
      type: "comment",
      recipeId,
      commentId,
      read: false,
      createdAt: Date.now(),
    });
  }
  
  return commentId;
}
```

### Like Toggle
```typescript
// Toggle like on recipe
async function toggleLike(recipeId: string) {
  const existingLike = await db
    .query("likes")
    .withIndex("by_recipe_and_user", q => 
      q.eq("recipeId", recipeId).eq("userId", currentUserId)
    )
    .first();
  
  if (existingLike) {
    // Unlike
    await db.delete(existingLike._id);
    return { liked: false };
  } else {
    // Like
    await db.insert("likes", {
      recipeId,
      userId: currentUserId,
      createdAt: Date.now(),
    });
    return { liked: true };
  }
}
```

## Validation Rules

All inputs validated with Zod schemas (see `lib/validations/`):

**Recipe:**
- Title: 3-200 characters
- Description: 0-1000 characters (optional)
- Cuisine: Required, valid cuisine type
- Skill Level: "beginner", "intermediate", or "advanced"
- Cook Time: 1-1440 minutes
- Prep Time: 0-1440 minutes
- Cost: "low", "medium", or "high"
- Servings: 1-100

**Comment:**
- Content: 1-1000 characters

**Recipe List:**
- Name: 1-100 characters
- Description: 0-500 characters (optional)

**Recipe Step:**
- Instruction: 1-500 characters
- Type: "preparation" or "cooking"

**Ingredient:**
- Name: 1-100 characters
- Amount: 1-50 characters

## Future Considerations

### Upcoming Features
1. **Recipe Sharing**: Share recipes via link
2. **Recipe Ratings**: Star ratings in addition to likes
3. **Recipe Collections**: Curated collections by admins
4. **Meal Planning**: Weekly meal planning with shopping lists
5. **Recipe Variations**: Alternative versions of recipes
6. **Cooking Timers**: Built-in timers for steps
7. **Nutritional Info**: Calculate and display nutrition facts

### Potential Schema Changes
- Add `recipes.imageUrl` for recipe photos
- Add `recipes.videoUrl` for cooking videos
- Add `recipes.tags` for flexible categorization
- Add `recipes.dietaryInfo` (vegetarian, vegan, gluten-free, etc.)
- Add `recipeSteps.timer` for step-specific timers
- Add `comments.parentId` for nested replies

