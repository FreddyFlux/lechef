# General Coding Standards

## Core Technologies
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style)
- **Backend/Database**: Convex
- **Authentication**: Clerk
- **Validation**: Zod
- **Hosting**: Vercel

## TypeScript Standards

### Use Strict TypeScript
- Enable strict mode in `tsconfig.json`
- Always provide explicit types for function parameters and return types
- Avoid using `any` - use `unknown` if type is truly unknown
- Use type inference for simple variable declarations

### Type Definitions
```typescript
// ✅ Good
interface Recipe {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  cuisine: string;
  skillLevel: string;
  createdAt: Date;
}

// ❌ Bad
interface Recipe {
  id: any;
  userId: string;
  title;
  description;
}
```

## Code Organization

### File Naming
- Use kebab-case for files: `recipe-card.tsx`, `recipe-list.tsx`
- Use PascalCase for components: `RecipeCard`, `RecipeList`
- Use camelCase for functions: `getRecipe`, `createRecipe`

### Import Order
1. React/Next.js imports
2. Third-party library imports
3. Convex imports
4. Local component imports
5. Local utility imports
6. Type imports

```typescript
// React/Next
import { useState } from "react";
import { redirect } from "next/navigation";

// Third-party
import { format } from "date-fns";

// Convex
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Local components
import { Button } from "@/components/ui/button";
import { RecipeCard } from "./components/recipe-card";

// Types
import type { Id } from "@/convex/_generated/dataModel";
```

## Code Style

### Prefer Functional Components
- Always use function declarations for components
- Use arrow functions for inline callbacks and utility functions

```typescript
// ✅ Good - Component
export function RecipeList({ recipes }: { recipes: Recipe[] }) {
  return <div>{/* ... */}</div>;
}

// ✅ Good - Utility function
const formatDate = (date: Date) => format(date, "do MMM yyyy");
```

### Destructuring
- Destructure props in function parameters
- Destructure objects when accessing multiple properties

```typescript
// ✅ Good
export function RecipeCard({ recipe, onView }: RecipeCardProps) {
  const { title, description, cuisine } = recipe;
  return <div>{title}</div>;
}

// ❌ Bad
export function RecipeCard(props: RecipeCardProps) {
  return <div>{props.recipe.title}</div>;
}
```

### Early Returns
- Use early returns to reduce nesting
- Handle error cases and loading states first

```typescript
// ✅ Good
export default function RecipePage({ params }: { params: { id: string } }) {
  const recipe = useQuery(api.recipes.getById, { id: params.id });
  
  if (recipe === undefined) return <div>Loading...</div>;
  if (recipe === null) return <div>Not found</div>;
  
  return <div>{recipe.title}</div>;
}
```

## Comments and Documentation

### JSDoc for Exported Functions
```typescript
/**
 * Creates a new recipe for the authenticated user
 * @param title - The title of the recipe
 * @param cuisine - The cuisine type
 * @returns The created recipe with ID
 */
export const createRecipe = mutation({
  // ...
});
```

### Inline Comments
- Use comments to explain "why", not "what"
- Keep comments concise and up-to-date
- Avoid obvious comments

```typescript
// ✅ Good - Explains why
// Group preparation steps separately to improve recipe readability
const prepSteps = steps.filter(s => s.type === "preparation");

// ❌ Bad - States the obvious
// Filter steps
const prepSteps = steps.filter(s => s.type === "preparation");
```

## Error Handling

### Use Try-Catch for Async Operations
```typescript
try {
  const result = await mutation({ title, cuisine });
  return { success: true, data: result };
} catch (error) {
  console.error("Failed to create recipe:", error);
  return { success: false, error: "Failed to create recipe" };
}
```

### Provide User-Friendly Error Messages
- Never expose internal error details to users
- Provide actionable error messages
- Log detailed errors to console for debugging

## Performance

### Avoid Unnecessary Re-renders
- Use `useMemo` for expensive computations
- Use `useCallback` for functions passed to children
- Keep component state minimal and localized

### Optimize Images
- Always use Next.js `Image` component
- Provide appropriate `width` and `height`
- Use `priority` for above-the-fold images

## Accessibility

### Semantic HTML
- Use appropriate HTML elements (`button`, `nav`, `main`, etc.)
- Provide `aria-label` for icon-only buttons
- Use proper heading hierarchy

### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Use `tabIndex` appropriately
- Test with keyboard navigation

## Testing Strategy
- Test user flows, not implementation details
- Focus on integration tests over unit tests
- Test error states and edge cases

