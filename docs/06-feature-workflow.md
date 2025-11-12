# Feature Development Workflow

This guide provides a step-by-step process for implementing new features in leChef.

## Development Process Overview

```
1. Plan Feature
   ├─ Define requirements
   ├─ Design data model
   └─ Sketch UI flow

2. Update Database Schema
   ├─ Add tables to convex/schema.ts
   ├─ Add indexes
   └─ Push schema changes

3. Create Validation Schemas
   ├─ Define Zod schemas
   └─ Export types

4. Implement Backend
   ├─ Create queries
   ├─ Create mutations
   └─ Add business logic

5. Build UI Components
   ├─ Create pages
   ├─ Add interactive components
   └─ Connect to backend

6. Test and Refine
   ├─ Test user flows
   ├─ Handle edge cases
   └─ Fix bugs

7. Document
   └─ Update docs if needed
```

## Step-by-Step Example: Adding "Recipe Collections" Feature

Let's walk through adding a new feature: allowing users to create curated recipe collections.

### Step 1: Plan Feature

**Requirements:**
- Users can create collections (e.g., "Italian Classics", "Quick Meals")
- Collections can contain recipes from any user
- Collections can be public or private
- Users can browse public collections

**Data Model:**
- Add `collections` table
- Add `collectionRecipes` junction table
- Add queries to list collections
- Add mutations to create/manage collections

**UI Flow:**
1. Add "Create Collection" button
2. Create collections page to browse
3. Add "Add to Collection" action on recipes

### Step 2: Update Database Schema

```typescript
// convex/schema.ts
export default defineSchema({
  // ... existing tables ...
  
  collections: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),
  
  collectionRecipes: defineTable({
    collectionId: v.id("collections"),
    recipeId: v.id("recipes"),
    addedAt: v.number(),
  })
    .index("by_collection", ["collectionId"])
    .index("by_recipe", ["recipeId"]),
});
```

Push changes:
```bash
npx convex dev  # In development
# Schema changes are applied automatically
```

### Step 3: Create Validation Schemas

```typescript
// lib/validations/collection.ts
import { z } from "zod";

export const collectionSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters"),
  description: z.string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  isPublic: z.boolean(),
});

export type CollectionInput = z.infer<typeof collectionSchema>;
```

### Step 4: Implement Backend

```typescript
// convex/collections.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./auth";

// List user's collections
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    
    return collections;
  },
});

// Create collection
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    const collectionId = await ctx.db.insert("collections", {
      userId,
      name: args.name,
      description: args.description,
      isPublic: args.isPublic,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return collectionId;
  },
});

// Add recipe to collection
export const addRecipe = mutation({
  args: {
    collectionId: v.id("collections"),
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    // Verify collection ownership
    const collection = await ctx.db.get(args.collectionId);
    if (!collection || collection.userId !== userId) {
      throw new Error("Collection not found");
    }
    
    // Check if already in collection
    const existing = await ctx.db
      .query("collectionRecipes")
      .withIndex("by_collection", (q) => q.eq("collectionId", args.collectionId))
      .filter((q) => q.eq(q.field("recipeId"), args.recipeId))
      .first();
    
    if (existing) {
      throw new Error("Recipe already in collection");
    }
    
    await ctx.db.insert("collectionRecipes", {
      collectionId: args.collectionId,
      recipeId: args.recipeId,
      addedAt: Date.now(),
    });
    
    return args.collectionId;
  },
});
```

### Step 5: Build UI Components

**Create Collections Page:**

```typescript
// app/collections/page.tsx
import { CollectionList } from "./components/collection-list";

export default function CollectionsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Collections</h1>
      <CollectionList />
    </div>
  );
}
```

**Create Collection List Component:**

```typescript
// app/collections/components/collection-list.tsx
"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CollectionCard } from "./collection-card";

export function CollectionList() {
  const collections = useQuery(api.collections.list);
  
  if (collections === undefined) {
    return <div>Loading collections...</div>;
  }
  
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No collections yet</p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <CollectionCard key={collection._id} collection={collection} />
      ))}
    </div>
  );
}
```

### Step 6: Test

**Manual Testing Checklist:**
- [ ] Can create collection
- [ ] Collection appears in list
- [ ] Can add recipe to collection
- [ ] Recipe appears in collection
- [ ] Can only see own collections
- [ ] Error handling works

**Edge Cases to Test:**
- [ ] Adding same recipe twice
- [ ] Adding recipe to non-existent collection
- [ ] Adding recipe to collection user doesn't own

### Step 7: Update Documentation

Update relevant docs:
- Add collections to app structure documentation
- Update schema documentation
- Add to feature list in README

## Common Development Tasks

### Adding a New Page

```typescript
// 1. Create page file
// app/new-feature/page.tsx
export default function NewFeaturePage() {
  return <div>New Feature</div>;
}

// 2. Add navigation link
// components/nav.tsx
<Link href="/new-feature">New Feature</Link>

// 3. Add metadata
export const metadata = {
  title: "New Feature | leChef",
};
```

### Adding a New Database Table

```typescript
// 1. Update schema
// convex/schema.ts
export default defineSchema({
  newTable: defineTable({
    userId: v.string(),
    name: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),
});

// 2. Create queries/mutations
// convex/newTable.ts
export const list = query({ /* ... */ });
export const create = mutation({ /* ... */ });
```

### Adding Form Validation

```typescript
// 1. Create Zod schema
// lib/validations/new-feature.ts
export const newFeatureSchema = z.object({
  name: z.string().min(2).max(100),
  // ... other fields
});

// 2. Use in form
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({
  resolver: zodResolver(newFeatureSchema),
});
```

### Adding a shadcn Component

```bash
# 1. Install component
npx shadcn@latest add [component-name]

# 2. Import and use
import { ComponentName } from "@/components/ui/component-name";
```

## Debugging Tips

### Convex Functions

```typescript
// Use console.log in Convex functions
export const myQuery = query({
  handler: async (ctx) => {
    console.log("Debug info:", someVariable);
    // View logs in Convex dashboard
  },
});
```

### React Components

```typescript
// Use React DevTools
// Add debugging
useEffect(() => {
  console.log("Component rendered with:", props);
}, [props]);
```

### Network Issues

Check Convex dashboard for:
- Function execution logs
- Error traces
- Performance metrics

## Best Practices

1. **Start Small**: Implement core functionality first, add enhancements later
2. **Test Early**: Test as you build, don't wait until the end
3. **Follow Patterns**: Use existing patterns from similar features
4. **Keep It Simple**: Don't over-engineer, solve the problem at hand
5. **Document Changes**: Update docs if you add new patterns
6. **Ask for Help**: Review similar features if stuck

## Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/recipe-collections

# 2. Make changes, commit frequently
git add .
git commit -m "Add collections schema"

# 3. Push and create PR
git push origin feature/recipe-collections

# 4. Merge to main after review
# Deploy happens automatically via Vercel
```

## Deployment

### Development
```bash
# Convex development server
npx convex dev

# Next.js development server
npm run dev
```

### Production
```bash
# Deploy Convex
npx convex deploy

# Deploy Vercel (automatic on git push to main)
git push origin main
```

## Checklist for Complete Feature

- [ ] Schema changes pushed to Convex
- [ ] Validation schemas created
- [ ] Backend queries/mutations implemented
- [ ] Backend functions tested in Convex dashboard
- [ ] UI components created
- [ ] Form validation working
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Authentication checks in place
- [ ] Ownership verification working
- [ ] Responsive design tested
- [ ] Dark mode tested
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to production

