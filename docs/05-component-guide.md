# Component Development Guide

This guide provides patterns and examples for building UI components in leChef.

## Component Architecture

### Component Hierarchy

```
app/
├── layout.tsx (Server - Root providers)
│   └── page.tsx (Server - Route pages)
│       └── Feature Layout (Server - Shared UI)
│           ├── Server Components (Static/SEO)
│           └── Client Components (Interactive)
│               ├── Presentational (Display data)
│               └── Container (Logic + data)
```

### Component Types

**Server Components** (Default):
- Page components
- Layout components
- Static content sections
- Data-fetching wrappers

**Client Components** (`"use client"`):
- Forms with state management
- Real-time data subscriptions
- Interactive controls
- Browser API usage

## UI Feedback Standards ⚠️

**CRITICAL PROJECT STANDARD:** Never use native browser alerts.

### Required Components

1. **AlertDialog** - For all deletion confirmations and critical actions
2. **Sonner (Toast)** - For all data mutation feedback (success/error)

### When to Use

- ✅ **AlertDialog**: Deletion confirmations, destructive actions
- ✅ **Toast**: Success messages, error messages, status updates
- ❌ **NEVER**: `alert()`, `confirm()`, `prompt()`

### Setup Required

```typescript
// app/layout.tsx - Must include Toaster
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />  {/* Required for toast notifications */}
      </body>
    </html>
  );
}
```

For complete patterns and examples, see [`.cursor/rules/07-ui-feedback-patterns.md`](../.cursor/rules/07-ui-feedback-patterns.md).

---

## shadcn/ui Components

### Installation

```bash
# Install commonly used components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add skeleton
npx shadcn@latest add alert
npx shadcn@latest add toast
```

### Basic Usage

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

## Common Component Patterns

### 1. List Component with Real-time Data

```typescript
// app/recipes/components/recipe-list.tsx
"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RecipeCard } from "./recipe-card";
import { RecipeCardSkeleton } from "./recipe-card-skeleton";

export function RecipeList() {
  const recipes = useQuery(api.recipes.list);
  
  // Loading state
  if (recipes === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  // Empty state
  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">No recipes found</p>
        <CreateRecipeDialog />
      </div>
    );
  }
  
  // Success state
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe._id} recipe={recipe} />
      ))}
    </div>
  );
}
```

### 2. Form Component with Validation

```typescript
// app/recipes/components/create-recipe-form.tsx
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recipeSchema, type RecipeInput } from "@/lib/validations/recipe";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CreateRecipeFormProps {
  onSuccess?: () => void;
}

export function CreateRecipeForm({ onSuccess }: CreateRecipeFormProps) {
  const router = useRouter();
  const createRecipe = useMutation(api.recipes.create);
  
  const form = useForm<RecipeInput>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: "",
      cuisine: "",
      skillLevel: "beginner",
      cookTime: 30,
      prepTime: 15,
    },
  });
  
  async function onSubmit(data: RecipeInput) {
    try {
      const recipeId = await createRecipe(data);
      form.reset();
      onSuccess?.();
      router.push(`/recipes/${recipeId}`);
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Failed to create recipe",
      });
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recipe Title</FormLabel>
              <FormControl>
                <Input placeholder="Delicious Recipe" {...field} />
              </FormControl>
              <FormDescription>
                Give your recipe a descriptive title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {form.formState.errors.root && (
          <div className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => form.reset()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create Recipe"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

### 3. Dialog/Modal Component

```typescript
// app/recipes/components/create-recipe-dialog.tsx
"use client"

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateRecipeForm } from "./create-recipe-form";

export function CreateRecipeDialog() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Recipe</DialogTitle>
          <DialogDescription>
            Add a new recipe to your collection
          </DialogDescription>
        </DialogHeader>
        <CreateRecipeForm 
          onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}
```

### 4. Delete Confirmation Component

**⚠️ CRITICAL PATTERN: NEVER use native browser `alert()`, `confirm()`, or `prompt()`**

Always use AlertDialog for confirmations and Sonner for notifications:

```typescript
// app/recipes/components/delete-recipe-button.tsx
"use client"

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface DeleteRecipeButtonProps {
  recipeId: Id<"recipes">;
  recipeTitle: string;
  redirectTo?: string;
}

export function DeleteRecipeButton({ 
  recipeId, 
  recipeTitle, 
  redirectTo 
}: DeleteRecipeButtonProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteRecipe = useMutation(api.recipes.remove);
  const router = useRouter();
  
  async function handleDelete() {
    setIsDeleting(true);
    
    try {
      await deleteRecipe({ id: recipeId });
      toast.success("Recipe deleted successfully");
      setDeleteDialogOpen(false);
      
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete recipe");
    } finally {
      setIsDeleting(false);
    }
  }
  
  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
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
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Key Requirements:**
1. ✅ Use controlled AlertDialog with `open` and `onOpenChange`
2. ✅ Use separate loading state (`isDeleting`)
3. ✅ Show success toast after successful deletion
4. ✅ Show error toast on failure
5. ❌ NEVER use `alert()`, `confirm()`, or `prompt()`

See [`.cursor/rules/07-ui-feedback-patterns.md`](../.cursor/rules/07-ui-feedback-patterns.md) for complete UI feedback patterns.

### 5. Loading Skeleton Component

```typescript
// app/recipes/components/recipe-card-skeleton.tsx
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RecipeCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### 6. Empty State Component

```typescript
// components/empty-state.tsx
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

// Usage
import { ChefHat } from "lucide-react";

<EmptyState
  icon={ChefHat}
  title="No recipes yet"
  description="Create your first recipe to get started"
  actionLabel="Create Recipe"
  onAction={() => setDialogOpen(true)}
/>
```

### 7. Error State Component

```typescript
// components/error-state.tsx
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
        <p>{message}</p>
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

## Page Component Pattern

```typescript
// app/recipes/page.tsx
import { RecipeList } from "./components/recipe-list";
import { CreateRecipeDialog } from "./components/create-recipe-dialog";

export default function RecipesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Recipes</h1>
          <p className="text-muted-foreground">
            Manage your recipe collection
          </p>
        </div>
        <CreateRecipeDialog />
      </div>
      
      <RecipeList />
    </div>
  );
}
```

## Layout Component Pattern

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
      <main>{children}</main>
    </div>
  );
}
```

## Styling Patterns

### Responsive Grid

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{/* ... */}</Card>)}
</div>
```

### Flex Layout

```typescript
<div className="flex items-center justify-between">
  <h2 className="text-xl font-semibold">Title</h2>
  <Button>Action</Button>
</div>
```

### Conditional Styling

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "p-4 rounded-lg",
  isActive && "bg-primary text-primary-foreground",
  !isActive && "bg-muted"
)}>
  Content
</div>
```

## Best Practices

### 1. Component Sizing
- Keep components focused (single responsibility)
- Extract reusable logic into hooks
- Split large components into smaller ones

### 2. Props Interface
- Always type props explicitly
- Use optional props with `?` for flexibility
- Provide default values when appropriate

### 3. Loading States
- Always handle `undefined` from useQuery
- Show skeletons for better UX
- Indicate loading on buttons during mutations

### 4. Error Handling
- Catch errors from mutations
- Display user-friendly messages
- Provide retry mechanisms

### 5. Accessibility
- Use semantic HTML elements
- Provide aria-labels for icon buttons
- Ensure keyboard navigation works
- Test with screen readers

### 6. Performance
- Use React.memo for expensive renders
- Use useCallback for functions passed to children
- Keep state localized
- Avoid unnecessary re-renders

