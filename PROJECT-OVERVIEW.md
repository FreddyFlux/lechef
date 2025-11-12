# leChef - Project Overview

## 🎯 Project Purpose

leChef is a modern web application for creating, sharing, and managing cooking recipes. Users can create recipes with rich metadata, follow step-by-step instructions, leave comments, and organize recipes into custom lists.

## 🏗️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui (New York style)
- **Backend**: Convex (database + backend functions)
- **Auth**: Clerk
- **Validation**: Zod
- **Hosting**: Vercel (frontend) + Convex (backend)

## 📁 Project Structure

```
leChef/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Root layout (providers)
│   ├── page.tsx             # Home page
│   └── [features]/          # Feature-based routes
│       ├── page.tsx         # Server Component (page)
│       └── components/      # Client Components
├── components/              # Shared components
│   ├── ui/                  # shadcn/ui components
│   └── ...                  # App-wide components
├── convex/                  # Backend (Convex)
│   ├── schema.ts            # Database schema
│   └── *.ts                 # Queries, mutations, actions
├── lib/                     # Utilities
│   ├── utils.ts             # General utilities (cn helper)
│   └── validations/         # Zod schemas
├── docs/                    # Documentation
│   ├── 00-README.md         # Docs overview
│   ├── 01-architecture-overview.md
│   ├── 02-app-structure.md
│   ├── 03-development-standards.md
│   ├── 04-convex-guide.md
│   ├── 05-component-guide.md
│   ├── 06-feature-workflow.md
│   └── 07-database-schema.md
└── .cursor/                 # Cursor IDE rules
    └── rules/               # Coding standards for Cursor
```

## 🗄️ Database Schema

### Core Tables

1. **recipes** - User's cooking recipes with metadata
2. **recipeSteps** - Step-by-step instructions (preparation + cooking)
3. **ingredients** - Ingredient lists for recipes
4. **comments** - User comments on recipes
5. **recipeLists** - Custom lists (favorites, meal plans, etc.)
6. **listRecipes** - Links recipes to lists
7. **likes** - User likes on recipes
8. **notifications** - Comment notifications for recipe owners

### Key Relationships

```
User (Clerk)
  └─ Has Many → Recipes
       └─ Has Many → Steps (preparation + cooking)
       └─ Has Many → Ingredients
       └─ Has Many → Comments
       └─ Has Many → Likes
  
  └─ Has Many → Recipe Lists
       └─ Contains Many → Recipes (via listRecipes)
  
  └─ Has Many → Notifications (when recipes are commented on)
```

## 🎨 Core Features

### 1. Recipes
- Create recipes with rich metadata (cuisine, skill level, cook time, cost, freeze/reheat options)
- Step-by-step instructions separated into preparation and cooking
- Ingredient lists with measurements
- User-friendly navigation

### 2. Comments & Engagement
- Leave comments on recipes
- Recipe owners receive notifications when users comment
- Like recipes
- Save recipes to custom lists

### 3. Recipe Lists
- Create custom lists (favorites, meal plans, etc.)
- Lists can be public or private
- Organize recipes into collections

### 4. Notifications
- Recipe owners get notified when users comment
- Mark notifications as read
- View notification history

## 🔑 Key Patterns

### Server Components by Default

```typescript
// ✅ Default - Server Component
export default async function RecipesPage() {
  return <div>{/* ... */}</div>;
}

// ⚠️ Only when needed - Client Component
"use client"

export function RecipeForm() {
  const [state, setState] = useState();
  return <form>{/* ... */}</form>;
}
```

### Convex Queries

```typescript
// Real-time data subscription
"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const recipes = useQuery(api.recipes.list);
// recipes updates automatically when data changes
```

### Convex Mutations

```typescript
// Data mutations
"use client"

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const createRecipe = useMutation(api.recipes.create);
await createRecipe({ title: "New Recipe" });
```

### Form Validation

```typescript
// Zod schema
export const recipeSchema = z.object({
  title: z.string().min(3).max(200),
  cuisine: z.string().min(1),
});

// React Hook Form + Zod
const form = useForm({
  resolver: zodResolver(recipeSchema),
});
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
# .env.local
CONVEX_DEPLOYMENT=your-deployment-url
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Start Development Servers

```bash
# Terminal 1: Convex
npx convex dev

# Terminal 2: Next.js
npm run dev
```

### 4. Access Application

http://localhost:3000

## 📖 Documentation

### For AI Agents

- **Start here**: [docs/00-README.md](./docs/00-README.md)
- **Architecture**: [docs/01-architecture-overview.md](./docs/01-architecture-overview.md)
- **App Structure**: [docs/02-app-structure.md](./docs/02-app-structure.md)
- **Coding Standards**: [docs/03-development-standards.md](./docs/03-development-standards.md)
- **Convex Guide**: [docs/04-convex-guide.md](./docs/04-convex-guide.md)
- **Component Patterns**: [docs/05-component-guide.md](./docs/05-component-guide.md)
- **Feature Workflow**: [docs/06-feature-workflow.md](./docs/06-feature-workflow.md)
- **Database Schema**: [docs/07-database-schema.md](./docs/07-database-schema.md)

### For Cursor IDE

- Rules: [.cursor/rules/](./.cursor/rules/)
  - General coding standards
  - Next.js patterns
  - Convex patterns
  - Component patterns
  - Validation patterns
  - Styling patterns
  - UI feedback patterns

## ✅ Critical Rules for AI Agents

### 1. Server Components by Default

```typescript
// ✅ Good - Start with Server Component
export default function RecipesPage() {
  return <div>{/* ... */}</div>;
}

// Only add "use client" when you need:
// - useState, useEffect, or other hooks
// - Event handlers (onClick, onChange)
// - Convex useQuery/useMutation
// - Browser APIs
```

### 2. Always Authenticate in Convex

```typescript
// ✅ In every query/mutation
export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return []; // or throw Error
    
    const userId = identity.subject;
    // ... use userId to filter data
  },
});
```

### 3. Always Filter by userId

```typescript
// ✅ Good - Filter by user
const recipes = await ctx.db
  .query("recipes")
  .withIndex("by_user", q => q.eq("userId", userId))
  .collect();

// ❌ Bad - Returns all users' data
const recipes = await ctx.db
  .query("recipes")
  .collect();
```

### 4. Use shadcn/ui Components

```typescript
// ✅ Good - Use shadcn
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ❌ Bad - Custom primitives
import { MyButton } from "./my-button";
```

### 5. Validate with Zod

```typescript
// ✅ Good - Zod validation
const recipeSchema = z.object({
  title: z.string().min(3).max(200),
});

const form = useForm({
  resolver: zodResolver(recipeSchema),
});

// Also validate in Convex mutations
if (args.title.length < 3) {
  throw new Error("Title too short");
}
```

### 6. Use Indexes for Queries

```typescript
// ✅ Good - Use index
.withIndex("by_user", q => q.eq("userId", userId))

// ❌ Bad - Full table scan
.filter(q => q.eq(q.field("userId"), userId))
```

### 7. NEVER Use Native Browser Alerts

```typescript
// ✅ Good - Use AlertDialog and toast
import { AlertDialog } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// ❌ Bad - Never use native alerts
alert("Success!");  // NO!
confirm("Delete?"); // NO!
```

## 🎯 Feature Development Workflow

1. **Plan Feature** - Define requirements and data model
2. **Update Schema** - Add/modify tables in `convex/schema.ts`
3. **Create Validations** - Define Zod schemas in `lib/validations/`
4. **Implement Backend** - Add queries/mutations in `convex/`
5. **Build UI** - Create components in `app/[feature]/components/`
6. **Test** - Verify user flows and edge cases
7. **Document** - Update docs if adding new patterns

## 🔍 Common Tasks

### Add New Page

```bash
# Create file
app/new-feature/page.tsx

# Add navigation
# Update components/nav.tsx
```

### Add shadcn Component

```bash
npx shadcn@latest add button
```

### Add Convex Table

```typescript
// convex/schema.ts
export default defineSchema({
  newTable: defineTable({
    userId: v.string(),
    name: v.string(),
  }).index("by_user", ["userId"]),
});
```

### Deploy Changes

```bash
# Deploy Convex
npx convex deploy --prod

# Deploy Vercel (auto on git push)
git push origin main
```

## 🐛 Debugging

### Check Convex Logs

```bash
# In terminal running convex dev
# Or visit: https://dashboard.convex.dev
```

### Check Next.js Logs

```bash
# In terminal running npm run dev
# Or browser console (F12)
```

### Common Issues

1. **"Not authenticated"** - User not signed in via Clerk
2. **"Convex connection failed"** - Check NEXT_PUBLIC_CONVEX_URL
3. **"Query returns empty"** - Check userId filtering
4. **"Build failed"** - Check TypeScript errors

## 📚 External Resources

- **Convex Docs**: https://docs.convex.dev
- **Next.js Docs**: https://nextjs.org/docs
- **Clerk Docs**: https://clerk.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs

## 🤝 Contributing

When implementing features:

1. Follow established patterns (see docs/)
2. Use Server Components by default
3. Validate all inputs with Zod
4. Always check authentication
5. Filter data by userId
6. Use shadcn/ui components
7. Follow file structure conventions
8. Document new patterns

## 📝 Notes for AI Assistants

This project is designed for AI-assisted development. The comprehensive documentation in `/docs` and rules in `/.cursor/rules` provide patterns and standards to follow.

**When working on features:**
- Read relevant docs first
- Follow established patterns
- Ask clarifying questions if unclear
- Test thoroughly before considering complete
- Update docs if adding new patterns

**Code Quality Standards:**
- TypeScript strict mode
- Server Components by default
- Zod validation everywhere
- Always authenticate and authorize
- Use indexes for database queries
- Handle loading, error, and empty states
- NEVER use native browser alerts - use AlertDialog and toast instead

The goal is to maintain high code quality, consistency, and scalability while enabling rapid feature development.

