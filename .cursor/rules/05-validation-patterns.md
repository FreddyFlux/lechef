# Validation Patterns with Zod

## Overview

Use Zod for all input validation in the application:
- Client-side form validation
- Runtime validation before Convex mutations
- API request/response validation

## Installation

```bash
npm install zod
npm install react-hook-form @hookform/resolvers
```

## Schema Definitions

### Organize Schemas by Feature
```
lib/
└── validations/
    ├── recipe.ts
    ├── comment.ts
    ├── recipe-list.ts
    └── notification.ts
```

### Example Schema Definitions
```typescript
// lib/validations/recipe.ts
import { z } from "zod";

export const recipeSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),
  description: z.string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  cuisine: z.string()
    .min(1, "Cuisine is required"),
  skillLevel: z.enum(["beginner", "intermediate", "advanced"], {
    errorMap: () => ({ message: "Please select a valid skill level" })
  }),
  cookTime: z.number()
    .int("Cook time must be a whole number")
    .min(1, "Cook time must be at least 1 minute")
    .max(1440, "Cook time cannot exceed 24 hours"),
  prepTime: z.number()
    .int("Prep time must be a whole number")
    .min(0, "Prep time cannot be negative")
    .max(1440, "Prep time cannot exceed 24 hours"),
  cost: z.enum(["low", "medium", "high"], {
    errorMap: () => ({ message: "Please select a valid cost level" })
  }),
  canFreeze: z.boolean(),
  canReheat: z.boolean(),
  servings: z.number()
    .int("Servings must be a whole number")
    .min(1, "Must serve at least 1 person")
    .max(100, "Cannot exceed 100 servings"),
});

export const createRecipeSchema = recipeSchema;

export const updateRecipeSchema = recipeSchema.partial().extend({
  id: z.string().min(1, "ID is required"),
});

// Type inference
export type RecipeInput = z.infer<typeof recipeSchema>;
export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
```

```typescript
// lib/validations/comment.ts
import { z } from "zod";

export const commentSchema = z.object({
  recipeId: z.string().min(1, "Recipe ID is required"),
  content: z.string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must not exceed 1000 characters"),
});

export type CommentInput = z.infer<typeof commentSchema>;
```

```typescript
// lib/validations/recipe-list.ts
import { z } from "zod";

export const recipeListSchema = z.object({
  name: z.string()
    .min(1, "List name is required")
    .max(100, "List name must not exceed 100 characters"),
  description: z.string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  isPublic: z.boolean(),
});

export type RecipeListInput = z.infer<typeof recipeListSchema>;
```

```typescript
// lib/validations/recipe-step.ts
import { z } from "zod";

export const recipeStepSchema = z.object({
  recipeId: z.string().min(1, "Recipe ID is required"),
  type: z.enum(["preparation", "cooking"], {
    errorMap: () => ({ message: "Step type must be 'preparation' or 'cooking'" })
  }),
  stepNumber: z.number()
    .int("Step number must be a whole number")
    .min(1, "Step number must be at least 1"),
  instruction: z.string()
    .min(1, "Instruction cannot be empty")
    .max(500, "Instruction must not exceed 500 characters"),
  order: z.number()
    .int("Order must be a whole number")
    .min(0),
});

export type RecipeStepInput = z.infer<typeof recipeStepSchema>;
```

```typescript
// lib/validations/ingredient.ts
import { z } from "zod";

export const ingredientSchema = z.object({
  recipeId: z.string().min(1, "Recipe ID is required"),
  name: z.string()
    .min(1, "Ingredient name is required")
    .max(100, "Ingredient name must not exceed 100 characters"),
  amount: z.string()
    .min(1, "Amount is required")
    .max(50, "Amount must not exceed 50 characters"),
  order: z.number()
    .int("Order must be a whole number")
    .min(0),
});

export type IngredientInput = z.infer<typeof ingredientSchema>;
```

## Client-Side Form Validation

### React Hook Form Integration
```typescript
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recipeSchema, type RecipeInput } from "@/lib/validations/recipe";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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

export function CreateRecipeForm() {
  const createRecipe = useMutation(api.recipes.create);
  
  const form = useForm<RecipeInput>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: "",
      description: "",
      cuisine: "",
      skillLevel: "beginner",
      cookTime: 30,
      prepTime: 15,
      cost: "medium",
      canFreeze: false,
      canReheat: false,
      servings: 4,
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
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your recipe..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {form.formState.errors.root && (
          <div className="text-sm text-red-500">
            {form.formState.errors.root.message}
          </div>
        )}
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating..." : "Create Recipe"}
        </Button>
      </form>
    </Form>
  );
}
```

## Server-Side Validation in Convex

### Convex Mutation with Validation
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    // Additional Zod validation on server
    // Note: You can import the same Zod schema here if needed
    // This provides extra safety even if client validation is bypassed
    
    if (args.title.length < 3) {
      throw new Error("Title must be at least 3 characters");
    }
    
    if (args.cookTime < 1 || args.cookTime > 1440) {
      throw new Error("Cook time must be between 1 and 1440 minutes");
    }
    
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
```

## Common Validation Patterns

### Conditional Validation
```typescript
export const recipeWithStepsSchema = recipeSchema.extend({
  steps: z.array(recipeStepSchema)
    .min(1, "Must include at least one step"),
}).refine(
  (data) => {
    // Ensure preparation steps come before cooking steps
    const prepSteps = data.steps.filter(s => s.type === "preparation");
    const cookingSteps = data.steps.filter(s => s.type === "cooking");
    
    if (cookingSteps.length > 0 && prepSteps.length > 0) {
      const maxPrepOrder = Math.max(...prepSteps.map(s => s.order));
      const minCookingOrder = Math.min(...cookingSteps.map(s => s.order));
      return maxPrepOrder < minCookingOrder;
    }
    return true;
  },
  {
    message: "Preparation steps must come before cooking steps",
    path: ["steps"],
  }
);
```

### Array Validation
```typescript
export const ingredientsSchema = z.array(ingredientSchema)
  .min(1, "Must include at least one ingredient")
  .max(50, "Cannot include more than 50 ingredients");
```

### Nested Object Validation
```typescript
export const fullRecipeSchema = z.object({
  title: z.string().min(3),
  cuisine: z.string().min(1),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(recipeStepSchema).min(1),
});
```

## Validation Utilities

### Reusable Validators
```typescript
// lib/validations/common.ts
import { z } from "zod";

export const idSchema = z.string().min(1, "ID is required");

export const positiveInteger = z.number()
  .int("Must be a whole number")
  .positive("Must be greater than 0");

export const nonNegativeInteger = z.number()
  .int("Must be a whole number")
  .nonnegative("Cannot be negative");

export const timestamp = z.number()
  .int()
  .positive("Invalid timestamp");

export const optionalString = z.string().trim().optional();

export const requiredString = z.string()
  .trim()
  .min(1, "This field is required");
```

## Error Handling

### Parse Errors
```typescript
function validateRecipe(data: unknown) {
  const result = recipeSchema.safeParse(data);
  
  if (!result.success) {
    // Get formatted errors
    const errors = result.error.format();
    console.error("Validation errors:", errors);
    
    // Get flat list of errors
    const issues = result.error.issues;
    issues.forEach(issue => {
      console.error(`${issue.path.join(".")}: ${issue.message}`);
    });
    
    return null;
  }
  
  return result.data;
}
```

## Best Practices

1. **Define schemas once, reuse everywhere**
   - Create schemas in `lib/validations/`
   - Import in both client forms and Convex functions

2. **Use type inference**
   - Let Zod generate TypeScript types
   - Use `z.infer<typeof schema>` for type safety

3. **Validate early and often**
   - Validate on client before submission
   - Validate again on server for security
   - Validate data coming from external sources

4. **Provide helpful error messages**
   - Make errors actionable
   - Guide users to correct input
   - Be specific about what's wrong

5. **Keep validation logic DRY**
   - Create reusable validation helpers
   - Compose complex schemas from simpler ones
   - Share common patterns across features

