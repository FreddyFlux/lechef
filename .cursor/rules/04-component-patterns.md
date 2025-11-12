# Component Patterns and Best Practices

## shadcn/ui Components

**CRITICAL: ONLY shadcn/ui components are permitted. No custom UI primitives.**

### Installing Components
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add alert-dialog
npx shadcn@latest add toast
```

### Component Usage
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{recipe.title}</CardTitle>
        <CardDescription>{recipe.cuisine} • {recipe.skillLevel}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline">View Recipe</Button>
      </CardContent>
    </Card>
  );
}
```

### Component Composition Rules
- ✅ Compose shadcn/ui components together
- ✅ Use Tailwind CSS for styling and layout
- ✅ Extend shadcn components with additional props
- ❌ Never create custom button/input/dialog components from scratch
- ❌ Never use other UI libraries (MUI, Ant Design, etc.)

## Client Component Patterns

### Form Components
```typescript
"use client"

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateRecipeForm() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const createRecipe = useMutation(api.recipes.create);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    try {
      await createRecipe({ title });
      setTitle(""); // Reset form
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create recipe");
    } finally {
      setIsPending(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">Recipe Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter recipe title"
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Recipe"}
      </Button>
    </form>
  );
}
```

### List Components with Real-time Updates
```typescript
"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RecipeCard } from "./recipe-card";

export function RecipeList() {
  const recipes = useQuery(api.recipes.list);
  
  // Handle loading state
  if (recipes === undefined) {
    return <div>Loading recipes...</div>;
  }
  
  // Handle empty state
  if (recipes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recipes found. Create your first recipe to get started!
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe._id} recipe={recipe} />
      ))}
    </div>
  );
}
```

### Dialog/Modal Components
```typescript
"use client"

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateRecipeDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const createRecipe = useMutation(api.recipes.create);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createRecipe({ title });
    setTitle("");
    setOpen(false); // Close dialog on success
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Recipe</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Recipe</DialogTitle>
          <DialogDescription>
            Add a new recipe to your collection
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe title"
            required
          />
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Delete Confirmation Pattern
```typescript
"use client"

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";

interface DeleteRecipeButtonProps {
  recipeId: Id<"recipes">;
  recipeTitle: string;
}

export function DeleteRecipeButton({ recipeId, recipeTitle }: DeleteRecipeButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const deleteRecipe = useMutation(api.recipes.remove);
  
  async function handleDelete() {
    setIsPending(true);
    try {
      await deleteRecipe({ id: recipeId });
    } catch (error) {
      console.error("Failed to delete recipe:", error);
    } finally {
      setIsPending(false);
    }
  }
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isPending}>
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{recipeTitle}" and all associated data.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Server Component Patterns

### Page Components
```typescript
// app/recipes/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RecipeList } from "./components/recipe-list";
import { CreateRecipeDialog } from "./components/create-recipe-dialog";

export default async function RecipesPage() {
  // Server-side authentication
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Recipes</h1>
        <CreateRecipeDialog />
      </div>
      <RecipeList />
    </div>
  );
}
```

### Layout Components
```typescript
// app/recipes/layout.tsx
import { RecipeNav } from "./components/recipe-nav";

export default function RecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <RecipeNav />
      <main className="container mx-auto py-6">
        {children}
      </main>
    </div>
  );
}
```

## Shared Component Patterns

### Loading Skeletons
```typescript
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function RecipeCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function RecipeListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### Empty States
```typescript
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Plus className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
```

### Error States
```typescript
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message, 
  retry 
}: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {retry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={retry}
            className="mt-4"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

## Component Organization

### File Structure per Feature
```
app/recipes/
├── page.tsx                      # Server Component - main page
├── layout.tsx                    # Server Component - layout
├── loading.tsx                   # Loading UI
├── error.tsx                     # Error boundary
└── components/
    ├── recipe-list.tsx            # Client Component - uses useQuery
    ├── recipe-card.tsx           # Can be Server or Client Component
    ├── create-recipe-form.tsx    # Client Component - form with state
    ├── delete-recipe-button.tsx  # Client Component - mutation
    ├── recipe-filters.tsx        # Client Component - interactive filters
    ├── ingredient-list.tsx        # Component for displaying ingredients
    └── step-list.tsx             # Component for displaying recipe steps
```

### Naming Conventions
- **Server Components**: No suffix needed (`recipe-card.tsx`)
- **Client Components**: No suffix needed, but add `"use client"` at top
- **Shared UI**: Place in `/components/ui/` (shadcn components)
- **Feature Components**: Colocate with feature in `app/[feature]/components/`
- **Utility Functions**: Place in `/lib/` directory

