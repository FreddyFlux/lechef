# Next.js Patterns and Best Practices

## Server Components by Default

**CRITICAL RULE: Default to Server Components. Only use Client Components when absolutely necessary.**

### When to Use Server Components (Default)
- Data fetching
- Accessing backend resources
- Keeping sensitive information on server
- Large dependencies that don't need client-side JavaScript

```typescript
// app/recipes/page.tsx
import { auth } from "@clerk/nextjs/server";
import { RecipeList } from "./components/recipe-list";

// This is a Server Component by default
export default async function RecipesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  return (
    <div>
      <h1>My Recipes</h1>
      <RecipeList userId={userId} />
    </div>
  );
}
```

### When to Use Client Components
Use `"use client"` directive ONLY for:
- Event handlers (onClick, onChange, onSubmit)
- React hooks (useState, useEffect, useContext)
- Browser APIs (localStorage, window, navigator)
- Convex real-time queries (useQuery, useMutation)
- Third-party libraries requiring client-side rendering

```typescript
// app/recipes/components/create-recipe-form.tsx
"use client"

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

export function CreateRecipeForm() {
  const [title, setTitle] = useState("");
  const createRecipe = useMutation(api.recipes.create);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createRecipe({ title });
    setTitle("");
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
      />
      <Button type="submit">Create</Button>
    </form>
  );
}
```

## Component Composition Strategy

### Push "use client" to the Deepest Level
- Keep parent components as Server Components
- Only add "use client" to the most specific component that needs it
- Never add "use client" to a parent when only a child needs it

```typescript
// ✅ Good Structure

// app/recipes/page.tsx (Server Component)
export default async function RecipesPage() {
  const { userId } = await auth();
  
  return (
    <div>
      <h1>My Recipes</h1>
      {/* Most of the page is server-rendered */}
      <RecipeList userId={userId} />
      {/* Only this specific component is client-side */}
      <CreateRecipeButton />
    </div>
  );
}

// app/recipes/components/recipe-list.tsx (Server Component)
export function RecipeList({ userId }: { userId: string }) {
  // This can stay server-side if it doesn't need interactivity
  return <div>{/* ... */}</div>;
}

// app/recipes/components/create-recipe-button.tsx (Client Component)
"use client"

export function CreateRecipeButton() {
  // Only this button needs client-side interactivity
  return <button onClick={handleClick}>Create</button>;
}
```

## App Router File Structure

### Route Organization
```
app/
├── layout.tsx                    # Root layout with providers
├── page.tsx                      # Home page
├── recipes/
│   ├── layout.tsx                # Recipes layout (optional)
│   ├── page.tsx                  # Recipes list page
│   ├── [id]/
│   │   ├── page.tsx              # Single recipe page
│   │   └── edit/
│   │       └── page.tsx          # Edit recipe page
│   └── components/               # Feature-specific components
│       ├── recipe-card.tsx
│       ├── recipe-form.tsx
│       └── ingredient-list.tsx
└── lists/
    ├── page.tsx                  # Recipe lists page
    └── components/
        ├── list-card.tsx
        └── create-list-form.tsx
```

### Layouts
- Use layouts for shared UI between routes
- Layouts persist across navigation (don't re-render)
- Nested layouts compose together

```typescript
// app/recipes/layout.tsx
export default function RecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto">
      <nav>{/* Shared navigation */}</nav>
      {children}
    </div>
  );
}
```

## Data Fetching Patterns

### Server Components - Direct Database Access
Server Components can use Convex queries directly through actions or by calling the Convex HTTP API.

```typescript
// For real-time updates, use Client Components with useQuery
// For one-time server-side data, use Convex actions or HTTP API
```

### Client Components - Real-time Queries
```typescript
"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function RecipeList() {
  const recipes = useQuery(api.recipes.list);
  
  if (recipes === undefined) return <div>Loading...</div>;
  if (recipes.length === 0) return <div>No recipes found</div>;
  
  return (
    <div>
      {recipes.map(recipe => (
        <RecipeCard key={recipe._id} recipe={recipe} />
      ))}
    </div>
  );
}
```

## Navigation

### Use Next.js Link Component
```typescript
import Link from "next/link";

<Link href="/recipes/123">View Recipe</Link>
```

### Programmatic Navigation
```typescript
"use client"

import { useRouter } from "next/navigation";

export function RecipeForm() {
  const router = useRouter();
  
  async function handleSubmit() {
    const result = await createRecipe({ title });
    router.push(`/recipes/${result}`);
  }
  
  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

## Loading and Error States

### Loading UI
```typescript
// app/recipes/loading.tsx
export default function Loading() {
  return <div>Loading recipes...</div>;
}
```

### Error Handling
```typescript
// app/recipes/error.tsx
"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Not Found Pages
```typescript
// app/recipes/[id]/not-found.tsx
export default function NotFound() {
  return <div>Recipe not found</div>;
}
```

## Metadata

### Static Metadata
```typescript
// app/recipes/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Recipes",
  description: "Browse and manage your recipe collection",
};
```

### Dynamic Metadata
```typescript
// app/recipes/[id]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}): Promise<Metadata> {
  // Fetch recipe data
  const recipe = await getRecipe(params.id);
  
  return {
    title: recipe.title,
    description: recipe.description,
  };
}
```

## Streaming and Suspense

### Use Suspense for Loading States
```typescript
import { Suspense } from "react";

export default function RecipesPage() {
  return (
    <div>
      <h1>My Recipes</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <RecipeList />
      </Suspense>
    </div>
  );
}
```

## Route Handlers (API Routes)

### Use ONLY for External Integrations
- Webhooks (Clerk, Stripe, etc.)
- Third-party API integrations
- OAuth callbacks

### DO NOT Use for Internal Data Mutations
- Use Convex mutations instead
- Keep business logic in Convex functions

```typescript
// ✅ Good - Webhook handler
// app/api/webhooks/clerk/route.ts
export async function POST(req: Request) {
  const payload = await req.json();
  // Handle Clerk webhook
  return Response.json({ success: true });
}

// ❌ Bad - Use Convex mutations instead
// app/api/recipes/create/route.ts
export async function POST(req: Request) {
  const recipe = await req.json();
  // Don't do this - use Convex mutations
}
```

