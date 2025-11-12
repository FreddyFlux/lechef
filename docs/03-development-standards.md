# Development Standards

This document outlines the coding standards, patterns, and best practices for the leChef application. These standards ensure consistency, maintainability, and scalability.

## TypeScript Standards

### Strict Mode
Always use TypeScript strict mode. The `tsconfig.json` is configured with:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Type Annotations
- **Function Parameters**: Always type explicitly
- **Return Types**: Always type explicitly for exported functions
- **Variables**: Use type inference for simple assignments

```typescript
// ✅ Good
function createRecipe(title: string, cuisine: string): Recipe {
  const recipe = { title, cuisine }; // inference OK
  return recipe;
}

// ❌ Bad
function createRecipe(title, cuisine) {
  return { title, cuisine };
}
```

### Avoid `any`
Never use `any` type. Use `unknown` if type is truly unknown:

```typescript
// ✅ Good
function parseData(data: unknown): Recipe {
  const result = recipeSchema.parse(data);
  return result;
}

// ❌ Bad
function parseData(data: any): Recipe {
  return data; // No type safety
}
```

### Type Imports
Use `import type` for type-only imports:

```typescript
import type { Id } from "@/convex/_generated/dataModel";
import type { Recipe } from "@/lib/types";
```

## Next.js Patterns

### Server Components by Default

**CRITICAL**: Always start with Server Components. Only add `"use client"` when absolutely necessary.

**When to use Server Components (default):**
- Pages and layouts
- Data fetching
- Static content
- SEO-critical content

**When to use Client Components:**
- Forms with interactivity (useState, onChange)
- Real-time Convex queries (useQuery)
- Browser APIs (localStorage, window)
- Event handlers (onClick, onSubmit)

```typescript
// ✅ Good - Server Component (default)
// app/recipes/page.tsx
import { RecipeList } from "./components/recipe-list";

export default async function RecipesPage() {
  return (
    <div>
      <h1>Recipes</h1>
      <RecipeList /> {/* Client component handles real-time data */}
    </div>
  );
}

// ✅ Good - Client Component (only when needed)
// app/recipes/components/recipe-list.tsx
"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function RecipeList() {
  const recipes = useQuery(api.recipes.list);
  return <div>{/* ... */}</div>;
}
```

### Component Composition

Push `"use client"` to the deepest component that needs it:

```typescript
// ✅ Good Structure
// app/recipes/page.tsx - Server Component
export default function RecipesPage() {
  return (
    <div>
      <Header /> {/* Server Component - static */}
      <RecipeList /> {/* Client Component - interactive */}
      <Footer /> {/* Server Component - static */}
    </div>
  );
}

// ❌ Bad Structure - unnecessary client component
"use client"

export default function RecipesPage() {
  // Entire page is client-side when only RecipeList needs it
  return <div>...</div>;
}
```

### File Structure

Organize files by feature, not by type:

```
app/
├── recipes/
│   ├── page.tsx                    # Main page
│   ├── [id]/
│   │   ├── page.tsx                # Detail page
│   │   └── edit/
│   │       └── page.tsx            # Edit page
│   └── components/                 # Feature-specific components
│       ├── recipe-list.tsx
│       ├── recipe-card.tsx
│       ├── create-recipe-form.tsx
│       └── delete-recipe-button.tsx
```

## Convex Patterns

### Query Structure

Always follow this pattern for queries:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    // 1. Authenticate
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    const userId = identity.subject;
    
    // 2. Query with index and filter
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    
    // 3. Return data
    return recipes;
  },
});

export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    // 1. Authenticate
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    // 2. Get record
    const recipe = await ctx.db.get(args.id);
    
    // 3. Verify ownership
    if (!recipe || recipe.userId !== identity.subject) {
      return null;
    }
    
    // 4. Return data
    return recipe;
  },
});
```

**Query Rules:**
- Always authenticate first
- Use indexes for performance
- Filter by `userId` for user data
- Return `null` or `[]` for not found (don't throw)
- Keep queries pure (no side effects)

### Mutation Structure

Always follow this pattern for mutations:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    cuisine: v.string(),
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
    
    // 3. Perform mutation
    const recipeId = await ctx.db.insert("recipes", {
      userId,
      title: args.title,
      cuisine: args.cuisine,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 4. Return result
    return recipeId;
  },
});
```

**Mutation Rules:**
- Always authenticate (throw if not authenticated)
- Always validate inputs
- Always verify ownership before updates/deletes
- Handle cascading deletes manually
- Throw descriptive errors
- Update timestamps

## Component Patterns

### Naming Conventions

```typescript
// Components: PascalCase
export function RecipeCard() {}
export function CreateRecipeForm() {}

// Files: kebab-case
// recipe-card.tsx
// create-recipe-form.tsx

// Functions: camelCase
function getRecipeTitle() {}
async function fetchRecipeData() {}
```

### Props Interfaces

```typescript
// ✅ Good - Inline for simple props
export function RecipeCard({ recipe, onView }: {
  recipe: Recipe;
  onView: (id: string) => void;
}) {
  return <div>{/* ... */}</div>;
}

// ✅ Good - Interface for complex props
interface CreateRecipeFormProps {
  initialValues?: Partial<RecipeInput>;
  onSuccess?: (recipeId: string) => void;
  onCancel?: () => void;
}

export function CreateRecipeForm(props: CreateRecipeFormProps) {
  const { initialValues, onSuccess, onCancel } = props;
  return <form>{/* ... */}</form>;
}
```

### Loading States

Always handle loading, empty, and error states:

```typescript
"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function RecipeList() {
  const recipes = useQuery(api.recipes.list);
  
  // Loading state
  if (recipes === undefined) {
    return <div>Loading recipes...</div>;
  }
  
  // Empty state
  if (recipes.length === 0) {
    return (
      <div className="text-center py-8">
        <p>No recipes found</p>
        <Button>Create your first recipe</Button>
      </div>
    );
  }
  
  // Success state
  return (
    <div className="grid gap-4">
      {recipes.map(recipe => (
        <RecipeCard key={recipe._id} recipe={recipe} />
      ))}
    </div>
  );
}
```

### Form Patterns

Use React Hook Form with Zod validation:

```typescript
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recipeSchema, type RecipeInput } from "@/lib/validations/recipe";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function CreateRecipeForm() {
  const createRecipe = useMutation(api.recipes.create);
  
  const form = useForm<RecipeInput>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: "",
      cuisine: "",
    },
  });
  
  async function onSubmit(data: RecipeInput) {
    try {
      await createRecipe(data);
      form.reset();
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Failed to create recipe",
      });
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

## Validation with Zod

### Schema Organization

Place schemas in `lib/validations/` by feature:

```typescript
// lib/validations/recipe.ts
import { z } from "zod";

export const recipeSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title too long"),
  cuisine: z.string()
    .min(1, "Cuisine is required"),
});

export type RecipeInput = z.infer<typeof recipeSchema>;
```

### Client-Side Validation

Use in React Hook Form:

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { recipeSchema } from "@/lib/validations/recipe";

const form = useForm({
  resolver: zodResolver(recipeSchema),
});
```

### Server-Side Validation

Use in Convex mutations:

```typescript
// Convex provides its own validators, but you can also use Zod for complex validation
if (args.title.length < 3) {
  throw new Error("Title must be at least 3 characters");
}
```

## Styling with Tailwind

### Utility-First Approach

```typescript
// ✅ Good - Tailwind utilities
<div className="flex items-center justify-between p-4 rounded-lg border">
  <h2 className="text-xl font-semibold">Title</h2>
</div>

// ❌ Bad - Custom CSS
<div className="custom-container">
  <h2 className="custom-title">Title</h2>
</div>
```

### Class Organization

Order classes logically:
1. Layout (flex, grid)
2. Box model (w-, h-, p-, m-)
3. Typography (text-, font-)
4. Visual (bg-, border-)
5. Interactive (hover:, focus:)
6. Responsive (sm:, md:, lg:)

```typescript
<button className="
  flex items-center
  px-4 py-2
  text-sm font-medium
  bg-primary text-primary-foreground
  rounded-md
  hover:bg-primary/90
  md:px-6
">
  Submit
</button>
```

### Use cn Utility

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className // Allow external overrides
)} />
```

## Error Handling

### Client-Side Errors

```typescript
"use client"

import { useState } from "react";
import { useMutation } from "convex/react";

export function CreateRecipeForm() {
  const [error, setError] = useState<string | null>(null);
  const createRecipe = useMutation(api.recipes.create);
  
  async function handleSubmit(data: RecipeInput) {
    setError(null);
    
    try {
      await createRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="text-destructive">{error}</div>}
      {/* Form fields */}
    </form>
  );
}
```

### Server-Side Errors

```typescript
// Convex mutation
export const create = mutation({
  handler: async (ctx, args) => {
    // Throw descriptive errors
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    if (args.title.length < 3) {
      throw new Error("Title must be at least 3 characters");
    }
    
    // Let unexpected errors bubble up
    const recipeId = await ctx.db.insert("recipes", data);
    return recipeId;
  },
});
```

## Code Organization

### Import Order

```typescript
// 1. React/Next.js
import { useState } from "react";
import { redirect } from "next/navigation";

// 2. Third-party libraries
import { format } from "date-fns";

// 3. Convex
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// 4. Components
import { Button } from "@/components/ui/button";
import { RecipeCard } from "./recipe-card";

// 5. Utilities
import { cn } from "@/lib/utils";
import { recipeSchema } from "@/lib/validations/recipe";

// 6. Types
import type { Id } from "@/convex/_generated/dataModel";
```

### File Exports

```typescript
// ✅ Good - Named exports for components
export function RecipeCard() {}
export function RecipeList() {}

// ✅ Good - Default export for pages
export default function RecipesPage() {}

// ❌ Bad - Mixed exports
export default function RecipeCard() {} // Component should be named export
export function RecipesPage() {} // Page should be default export
```

## Performance Best Practices

### Avoid Unnecessary Re-renders

```typescript
// ✅ Good - Memoize expensive calculations
const sortedRecipes = useMemo(() => 
  recipes.sort((a, b) => a.title.localeCompare(b.title)),
  [recipes]
);

// ✅ Good - Memoize callbacks passed to children
const handleEdit = useCallback((id: string) => {
  // Edit logic
}, []);
```

### Use Convex Efficiently

```typescript
// ✅ Good - Single query with joins
export const getRecipeWithDetails = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.recipeId);
    const steps = await ctx.db
      .query("recipeSteps")
      .withIndex("by_recipe", q => q.eq("recipeId", args.recipeId))
      .collect();
    
    return { ...recipe, steps };
  },
});

// ❌ Bad - Multiple separate queries from client
// Don't fetch recipe and steps separately
```

## Documentation

### JSDoc for Exported Functions

```typescript
/**
 * Creates a new recipe for the authenticated user
 * @param title - The title of the recipe
 * @param cuisine - The cuisine type
 * @returns The ID of the created recipe
 * @throws Error if user is not authenticated
 */
export const create = mutation({
  // ...
});
```

### Inline Comments

```typescript
// ✅ Good - Explain why, not what
// Group preparation steps separately to improve recipe readability
const prepSteps = steps.filter(s => s.type === "preparation");

// ❌ Bad - States the obvious
// Set title to args.title
const title = args.title;
```

## UI Feedback & User Interaction ⚠️

### CRITICAL STANDARD: No Native Browser Alerts

**NEVER use `alert()`, `confirm()`, or `prompt()`.** Always use shadcn components.

### Deletion Confirmations

```typescript
// ✅ Good - Use AlertDialog
import { AlertDialog, AlertDialogContent, ... } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);

async function handleDelete() {
  setIsDeleting(true);
  try {
    await deleteItem({ id });
    toast.success("Item deleted successfully");
    setDeleteDialogOpen(false);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Failed to delete item");
  } finally {
    setIsDeleting(false);
  }
}

// ❌ Bad - Never use native alerts
if (confirm("Delete?")) {  // NO!
  await deleteItem({ id });
  alert("Deleted!");  // NO!
}
```

### Toast Notifications

Use Sonner for all data mutation feedback:

```typescript
import { toast } from "sonner";

// ✅ Success notifications
toast.success("Recipe created successfully");
toast.success("Recipe updated successfully");

// ✅ Error notifications
toast.error(error instanceof Error ? error.message : "Failed to save");

// ❌ Never use console or alert for user feedback
alert("Success!");  // NO!
console.log("Error occurred");  // NO! (logging is OK, but show toast too)
```

### Required Setup

The Toaster component MUST be in your root layout:

```typescript
// app/layout.tsx
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

**For complete patterns, see:**
- [`.cursor/rules/07-ui-feedback-patterns.md`](../.cursor/rules/07-ui-feedback-patterns.md)
- [Component Guide - Delete Confirmation](./05-component-guide.md#4-delete-confirmation-component)

---

## Accessibility

### Semantic HTML

```typescript
// ✅ Good
<nav>
  <ul>
    <li><a href="/recipes">Recipes</a></li>
  </ul>
</nav>

<button onClick={handleClick}>Submit</button>

// ❌ Bad
<div onClick={handleNav}>Link</div>
<div onClick={handleClick}>Submit</div>
```

### ARIA Labels

```typescript
<Button variant="ghost" size="icon" aria-label="Delete recipe">
  <Trash2 className="h-4 w-4" />
</Button>
```

### Keyboard Navigation

Ensure all interactive elements are keyboard accessible:
```typescript
<div 
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === "Enter" && handleClick()}
>
  Clickable div
</div>
```

---

## Code Quality Best Practices

### Duplicate Code Reduction

**Always extract duplicate code into shared components:**

```typescript
// ❌ Bad - Duplicate code in multiple components
// RecipeCard.tsx
<div className="flex items-center gap-2">
  <Clock className="h-4 w-4" />
  <span>{recipe.cookTime} minutes</span>
</div>

// ListRecipeCard.tsx  
<div className="flex items-center gap-2">
  <Clock className="h-4 w-4" />
  <span>{recipe.cookTime} minutes</span>
</div>

// ✅ Good - Shared component
// components/recipes/recipe-metadata.tsx
export function RecipeMetadata({ recipe }: RecipeMetadataProps) {
  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4" />
      <span>{recipe.cookTime} minutes</span>
    </div>
  );
}
```

### "use client" Optimization

**Place "use client" at the lowest possible level in the component tree:**

```typescript
// ❌ Bad - Entire component is client-side
"use client";
export function Header() {
  const pathname = usePathname(); // Only this needs client
  return (
    <header>
      <Logo /> {/* Server component */}
      <Nav pathname={pathname} /> {/* Client component */}
    </header>
  );
}

// ✅ Good - Only interactive parts are client-side
// components/header.tsx (Server Component)
export function Header() {
  return (
    <header>
      <Logo /> {/* Server component */}
      <HeaderNav /> {/* Client component */}
    </header>
  );
}

// components/header-nav.tsx (Client Component)
"use client";
export function HeaderNav() {
  const pathname = usePathname();
  // ... navigation logic
}
```

### Database Query Performance

**Always use indexes for queries, especially compound indexes for common patterns:**

```typescript
// ❌ Bad - Querying all records then filtering
const publicRecipes = await ctx.db
  .query("recipes")
  .withIndex("by_cuisine", (q) => q.eq("cuisine", cuisine))
  .collect();
const recipe = publicRecipes.find((r) => r.slug === args.slug);

// ✅ Good - Using compound index
const recipe = await ctx.db
  .query("recipes")
  .withIndex("by_cuisine_and_slug", (q) =>
    q.eq("cuisine", cuisine).eq("slug", args.slug)
  )
  .first();
```

**Add indexes in schema for common query patterns:**
```typescript
// convex/schema.ts
recipes: defineTable({...})
  .index("by_cuisine", ["cuisine"])
  .index("by_cuisine_and_slug", ["cuisine", "slug"]) // Compound index
```

### Security Best Practices

**Always verify ownership for user-specific data:**

```typescript
// ✅ Good - Verifies ownership
export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getUserIdOrNull(ctx);
    if (!userId) return null;
    
    const recipe = await ctx.db.get(args.id);
    if (!recipe || recipe.userId !== userId) {
      return null; // Don't leak that recipe exists
    }
    return recipe;
  },
});
```

**For shared/public resources, always check the sharing flag:**

```typescript
// ✅ Good - Checks isPublic flag
export const getPublicBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const recipe = await ctx.db
      .query("recipes")
      .withIndex("by_public_and_slug", (q) =>
        q.eq("isPublic", true).eq("slug", args.slug)
      )
      .first();
    
    // Returns null if not public, even if recipe exists
    return recipe || null;
  },
});
```

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] All TypeScript errors resolved
- [ ] No `any` types used
- [ ] Server Components used by default
- [ ] Client Components only when necessary
- [ ] All queries filter by `userId`
- [ ] All mutations verify ownership
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Tests pass (when applicable)
- [ ] No duplicate code (extract to shared components)
- [ ] Database queries use appropriate indexes
- [ ] "use client" directive placed at lowest possible level
- [ ] Shared resources (like public recipes) properly secured

