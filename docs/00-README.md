# leChef Documentation

Welcome to the leChef documentation! This folder contains comprehensive guides for building and maintaining the cooking recipe application.

## 🚀 New to the Project?

**Start here:**
1. Read [PROJECT-OVERVIEW.md](../PROJECT-OVERVIEW.md) - Comprehensive quick reference
2. Review [Architecture Overview](./01-architecture-overview.md) - Understand the system
3. Follow the [Learning Path](#learning-paths) below based on your needs

## 📚 Documentation Structure

### Core Documentation

1. **[Architecture Overview](./01-architecture-overview.md)** - High-level system architecture and design decisions
2. **[App Structure and Domain Model](./02-app-structure.md)** - Domain entities, relationships, and business logic
3. **[Development Standards](./03-development-standards.md)** - Coding standards and best practices
4. **[Convex Backend Guide](./04-convex-guide.md)** - Database schema and backend patterns
5. **[Component Development Guide](./05-component-guide.md)** - UI component patterns and examples
6. **[Feature Development Workflow](./06-feature-workflow.md)** - Step-by-step guide for implementing features
7. **[Database Schema](./07-database-schema.md)** - Complete database documentation

## 🗺️ Documentation Roadmap

```
Entry Points
├── PROJECT-OVERVIEW.md        → Quick reference with code examples
└── docs/00-README.md           → Documentation navigation
    │
    ├── Learning Path
    │   ├── 01-architecture-overview.md    → Understand the system
    │   ├── 02-app-structure.md            → Learn domain models
    │   └── 03-development-standards.md    → Follow best practices
    │
    ├── Implementation Path
    │   ├── 06-feature-workflow.md         → Feature development steps
    │   ├── 04-convex-guide.md             → Backend implementation
    │   ├── 05-component-guide.md          → UI implementation
    │   └── 07-database-schema.md          → Data modeling
```

## 🎯 Quick Lookup: "I Want To..."

| I Want To... | Read This |
|-------------|-----------|
| Understand the architecture | [01-architecture-overview.md](./01-architecture-overview.md) |
| Add a new feature | [06-feature-workflow.md](./06-feature-workflow.md) |
| Create a Convex query/mutation | [04-convex-guide.md](./04-convex-guide.md) |
| Build a new component | [05-component-guide.md](./05-component-guide.md) |
| Add UI feedback (toasts/confirmations) | [.cursor/rules/07-ui-feedback-patterns.md](../.cursor/rules/07-ui-feedback-patterns.md) |
| Understand data models | [02-app-structure.md](./02-app-structure.md) or [07-database-schema.md](./07-database-schema.md) |
| Find coding standards | [03-development-standards.md](./03-development-standards.md) |
| See code examples | [PROJECT-OVERVIEW.md](../PROJECT-OVERVIEW.md) |

## 📖 Learning Paths

### Path 1: For New Developers (Complete Beginner)

**Goal: Understand the project and start contributing**

1. 📘 [PROJECT-OVERVIEW.md](../PROJECT-OVERVIEW.md) - Understand tech stack and patterns (20 min)
2. 🏗️ [01-architecture-overview.md](./01-architecture-overview.md) - System design (30 min)
3. 📦 [02-app-structure.md](./02-app-structure.md) - Domain models and business logic (20 min)
4. ⚙️ [06-feature-workflow.md](./06-feature-workflow.md) - How to add features (30 min)
5. 💻 Start building! Reference other docs as needed

**Estimated time: 1.5 hours**

### Path 2: For AI Agents / Experienced Developers

**Goal: Quickly understand patterns and start implementing**

1. 📘 [PROJECT-OVERVIEW.md](../PROJECT-OVERVIEW.md) - Quick reference (10 min)
2. 🏗️ [01-architecture-overview.md](./01-architecture-overview.md) - System design (15 min)
3. 📋 [03-development-standards.md](./03-development-standards.md) - Coding patterns (15 min)
4. 🗄️ [04-convex-guide.md](./04-convex-guide.md) - Backend patterns (15 min)
5. 🎨 [05-component-guide.md](./05-component-guide.md) - UI patterns (15 min)
6. Start implementing with [06-feature-workflow.md](./06-feature-workflow.md) as reference

**Estimated time: 1 hour**

### Path 3: For Understanding Existing Code

**Goal: Navigate and understand the codebase**

1. 📘 [PROJECT-OVERVIEW.md](../PROJECT-OVERVIEW.md) - Get context
2. 🏗️ [01-architecture-overview.md](./01-architecture-overview.md) - System architecture
3. 📦 [02-app-structure.md](./02-app-structure.md) - Domain models and relationships
4. 🗄️ [07-database-schema.md](./07-database-schema.md) - Data structure
5. Browse code with understanding of patterns

**Estimated time: 45 minutes**

## 📂 Understanding the Two Documentation Systems

### `/docs` - Comprehensive Project Documentation

**Purpose**: Detailed guides for all developers (human and AI)

**Contents**:
- Architecture and design decisions
- Development workflows and standards
- Implementation guides with examples
- Setup and deployment instructions

**Audience**: Everyone working on the project

**When to use**:
- Learning the system
- Implementing features
- Understanding architectural decisions
- Setting up environments

### `/.cursor/rules` - AI-Specific Coding Patterns

**Purpose**: Concise rules for Cursor IDE and AI assistants

**Contents**:
- Specific coding patterns to follow
- Quick-reference rules for consistency
- AI-optimized format (concise, actionable)
- Focus on "do this, not that" examples

**Audience**: Cursor IDE, Claude Code, and other AI coding assistants

**When to use**:
- AI agents need quick pattern reference
- Enforcing coding consistency
- Quick lookup during code generation

### When to Use Which?

| Scenario | Use `/docs` | Use `/.cursor/rules` |
|----------|-------------|----------------------|
| Learning the system | ✅ | ❌ |
| Implementing features | ✅ | ✅ (for patterns) |
| Understanding architecture | ✅ | ❌ |
| Quick pattern lookup | ⚠️ (slower) | ✅ (faster) |
| AI code generation | ✅ (context) | ✅ (rules) |
| Human reading | ✅ | ⚠️ (AI-optimized) |

**Best Practice**: Read `/docs` to understand, reference `/.cursor/rules` for quick pattern lookup during implementation.

## 🎯 Project Overview

**leChef** is a modern web application for creating, sharing, and managing cooking recipes with rich metadata, step-by-step instructions, and user engagement features.

### Core Technologies

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Backend**: Convex (database + backend functions)
- **Auth**: Clerk
- **Validation**: Zod
- **Hosting**: Vercel

### Key Features

1. **Recipes** - Create recipes with rich metadata (cuisine, skill level, cook time, cost, freeze/reheat options)
2. **Step-by-Step Instructions** - Separate preparation and cooking steps for easy navigation
3. **Ingredient Lists** - Organized ingredient lists with measurements
4. **Comments** - Users can leave comments on recipes
5. **Recipe Lists** - Create custom lists (favorites, meal plans, etc.)
6. **Notifications** - Recipe owners get notified when users comment
7. **Likes & Saves** - Users can like recipes and save them to lists

## 🏗️ Architecture Principles

### Server Components by Default

The app uses Next.js App Router with Server Components as the default. Client Components are used only when necessary for:
- Interactive forms and controls
- Real-time data subscriptions (Convex useQuery)
- Browser APIs and React hooks

### Real-time Backend with Convex

Convex provides:
- NoSQL document database
- Type-safe backend functions (queries, mutations, actions)
- Real-time subscriptions with automatic UI updates
- Built-in authentication integration

### Type Safety Throughout

- TypeScript strict mode
- Zod validation for all inputs
- Auto-generated types from Convex schema
- Full type inference from database to UI

## 📖 How to Use This Documentation

### For Implementing New Features

1. Read the **Architecture Overview** to understand the system
2. Review the **App Structure** to understand domain models
3. Check the **Feature Development Workflow** for step-by-step guidance
4. Reference **Convex Guide** for database operations
5. Use **Component Guide** for UI patterns

### For Understanding Existing Code

1. Start with **Architecture Overview** for big picture
2. Review **App Structure** to understand entities
3. Dive into specific guides as needed

### For Code Reviews

1. Use **Development Standards** as checklist
2. Verify patterns match **Convex Guide**
3. Check components follow **Component Guide**

## 🚀 Quick Links

- [Convex Dashboard](https://dashboard.convex.dev)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🤝 Contributing

This documentation is designed to help AI agents and developers contribute effectively. When adding new features:

1. Follow the established patterns
2. Update documentation if adding new patterns
3. Keep consistency with existing code
4. Add tests for critical functionality

## 📝 Notes for AI Agents

When working with this codebase:

- **Always** check authentication before data access
- **Always** filter queries by userId for user-specific data
- **Always** validate inputs with Zod
- **NEVER** use native browser `alert()`, `confirm()`, or `prompt()` - use AlertDialog and toast instead
- **Prefer** Server Components over Client Components
- **Use** Convex mutations for data changes (not API routes)
- **Use** shadcn/ui components exclusively (no custom UI primitives)
- **Follow** the established file structure and naming conventions

For complex features, break work into smaller tasks and validate each step before proceeding.

**Critical UI Standards:**
- Use `AlertDialog` for all deletion confirmations
- Use `toast` (Sonner) for all data mutation feedback
- See [`.cursor/rules/07-ui-feedback-patterns.md`](../.cursor/rules/07-ui-feedback-patterns.md) for complete patterns

