# Architecture Overview

## System Architecture

leChef is built as a modern, full-stack web application using Next.js and Convex. The architecture follows these core principles:

1. **Server-First Rendering**: Maximize server components for performance
2. **Real-time Updates**: Leverage Convex for live data synchronization
3. **Type Safety**: End-to-end TypeScript with runtime validation
4. **Progressive Enhancement**: Core functionality works without JavaScript

## Technology Stack

### Frontend Layer

```
┌─────────────────────────────────────────┐
│         Next.js 16 (App Router)         │
├─────────────────────────────────────────┤
│  Server Components (Default)            │
│  ├─ Pages (data fetching)               │
│  ├─ Layouts (shared UI)                 │
│  └─ Static content                      │
├─────────────────────────────────────────┤
│  Client Components (When Needed)        │
│  ├─ Interactive forms                   │
│  ├─ Real-time queries (Convex)          │
│  └─ Browser APIs                        │
├─────────────────────────────────────────┤
│  UI Layer                               │
│  ├─ shadcn/ui components                │
│  ├─ Tailwind CSS styling               │
│  └─ Lucide icons                        │
└─────────────────────────────────────────┘
```

### Backend Layer

```
┌─────────────────────────────────────────┐
│              Convex                      │
├─────────────────────────────────────────┤
│  Queries (Read Operations)              │
│  ├─ Real-time subscriptions             │
│  ├─ Automatic invalidation              │
│  └─ Cached results                      │
├─────────────────────────────────────────┤
│  Mutations (Write Operations)           │
│  ├─ ACID transactions                   │
│  ├─ Optimistic updates                  │
│  └─ Automatic revalidation              │
├─────────────────────────────────────────┤
│  Database (NoSQL Document Store)        │
│  ├─ Tables with schema                  │
│  ├─ Indexes for performance             │
│  └─ Relationships via IDs               │
└─────────────────────────────────────────┘
```

### Authentication Layer

```
┌─────────────────────────────────────────┐
│               Clerk                      │
├─────────────────────────────────────────┤
│  ├─ User management                     │
│  ├─ Session handling                    │
│  ├─ OAuth providers                     │
│  └─ Webhook events                      │
└─────────────────────────────────────────┘
```

## Application Structure

### Directory Layout

```
leChef/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (providers)
│   ├── page.tsx                  # Home page
│   ├── recipes/                  # Recipe management
│   │   ├── page.tsx              # List all recipes
│   │   ├── [id]/                 # Individual recipe
│   │   └── components/           # Feature-specific components
│   ├── lists/                    # Recipe list management
│   │   ├── page.tsx              # List all lists
│   │   ├── [id]/                 # Individual list
│   │   └── components/
│   └── comments/                 # Comment management
│       └── components/
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui components
│   ├── theme-provider.tsx        # Theme management
│   └── theme-toggle.tsx          # Dark mode toggle
├── convex/                       # Backend (Convex)
│   ├── schema.ts                 # Database schema
│   ├── recipes.ts                # Recipe functions
│   ├── comments.ts               # Comment functions
│   ├── recipeLists.ts            # List functions
│   ├── notifications.ts          # Notification functions
│   └── auth.ts                   # Auth helpers
├── lib/                          # Utilities
│   ├── utils.ts                  # General utilities
│   └── validations/              # Zod schemas
│       ├── recipe.ts
│       ├── comment.ts
│       ├── recipe-list.ts
│       └── notification.ts
└── docs/                         # Documentation
    ├── 00-README.md
    ├── 01-architecture-overview.md
    └── ...
```

## Data Flow

### Read Path (Queries)

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │ 1. Views page
       ▼
┌──────────────────────┐
│  Server Component    │  ← Authentication (Clerk)
│  (Initial Load)      │
└──────┬───────────────┘
       │ 2. Renders with initial data
       ▼
┌──────────────────────┐
│  Client Component    │
│  with useQuery()     │
└──────┬───────────────┘
       │ 3. Subscribes to real-time data
       ▼
┌──────────────────────┐
│  Convex Query        │  ← Checks auth
│                      │  ← Applies filters (userId)
└──────┬───────────────┘
       │ 4. Queries database
       ▼
┌──────────────────────┐
│  Database            │
│  (Returns data)      │
└──────┬───────────────┘
       │ 5. Auto-updates on changes
       ▼
┌──────────────────────┐
│  UI Re-renders       │
└──────────────────────┘
```

### Write Path (Mutations)

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │ 1. Submits form
       ▼
┌──────────────────────┐
│  Client Component    │
│  with useMutation()  │
└──────┬───────────────┘
       │ 2. Validates with Zod
       ▼
┌──────────────────────┐
│  Convex Mutation     │  ← Checks auth
│                      │  ← Validates input
└──────┬───────────────┘
       │ 3. Writes to database
       ▼
┌──────────────────────┐
│  Database            │
│  (Persists data)     │
└──────┬───────────────┘
       │ 4. Triggers query invalidation
       ▼
┌──────────────────────┐
│  Subscribed Queries  │  ← Auto-refetch
│  Update              │
└──────┬───────────────┘
       │ 5. UI updates automatically
       ▼
┌──────────────────────┐
│  User sees result    │
└──────────────────────┘
```

## Authentication Flow

### Initial Authentication

```
User visits app
    ↓
Clerk Middleware checks session
    ↓
No session? → Redirect to /sign-in
    ↓
User signs in (email/OAuth)
    ↓
Clerk creates session
    ↓
Redirect to app
    ↓
User authenticated
```

### Protected Resources

Every Convex query/mutation:
1. Calls `ctx.auth.getUserIdentity()`
2. Checks if identity exists
3. Extracts `userId` from `identity.subject`
4. Filters all queries by `userId`
5. Verifies ownership for updates/deletes

## Real-time Synchronization

Convex provides automatic real-time updates:

```
User A creates recipe
    ↓
Convex mutation writes to DB
    ↓
DB change detected
    ↓
All subscribed queries invalidate
    ↓
User A's UI updates (same device)
User B's UI updates (if viewing same data)
```

**Benefits:**
- No manual cache invalidation
- No stale data
- Collaborative features possible
- Offline support (coming soon)

## State Management

### Server State (Convex)
- Recipes
- Comments
- Recipe lists
- Notifications
- User profiles

**Managed by:** Convex queries with automatic caching and invalidation

### Client State (React)
- Form inputs
- UI toggles (dialogs, dropdowns)
- Active filters
- Search queries

**Managed by:** React hooks (useState, useReducer, useContext)

### URL State
- Current page
- Filters and sorting
- Selected recipe/list

**Managed by:** Next.js router and URL search params

## Performance Optimizations

### Server Components
- Reduce JavaScript bundle size
- Faster initial page load
- SEO-friendly rendering

### Convex Caching
- Results cached automatically
- Shared across users when appropriate
- Invalidated on data changes

### Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components
- Lazy loading of modal content

### Database Indexes
- Index by `userId` for all user data
- Index by foreign keys for joins
- Compound indexes for common queries

## Security Model

### Authentication
- Clerk handles all auth flows
- JWT tokens for API requests
- Automatic session management

### Authorization
- All Convex functions check authentication
- User can only access their own data
- Public recipes readable by all
- Only creator can delete their recipes

### Data Isolation
- Every query filters by `userId`
- Mutations verify ownership before updates
- No cross-user data leakage

### Input Validation
- Client-side: Zod validation in forms
- Server-side: Convex validators + runtime checks
- Defense in depth approach

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│           Vercel (Frontend)             │
│  ├─ Next.js app                         │
│  ├─ Edge Functions (Middleware)         │
│  └─ CDN (Static assets)                 │
└─────────────────┬───────────────────────┘
                  │
                  │ API calls
                  ▼
┌─────────────────────────────────────────┐
│           Convex (Backend)              │
│  ├─ Database                            │
│  ├─ Functions (Queries/Mutations)       │
│  └─ File Storage (future)               │
└─────────────────┬───────────────────────┘
                  │
                  │ Auth verification
                  ▼
┌─────────────────────────────────────────┐
│             Clerk (Auth)                │
│  ├─ User management                     │
│  ├─ Session handling                    │
│  └─ Webhooks                            │
└─────────────────────────────────────────┘
```

## Scaling Considerations

### Current Architecture (MVP)
- Single region deployment
- Convex auto-scales
- Suitable for 1000s of concurrent users

### Future Scaling Options
- Multi-region Convex deployment
- CDN for static assets (Vercel default)
- Optimistic updates for better perceived performance
- Background jobs for analytics

## Development Workflow

```
1. Create feature branch
2. Define Convex schema changes
3. Create Zod validation schemas
4. Implement Convex queries/mutations
5. Create UI components
6. Test locally with Convex dev server
7. Deploy to preview (Vercel)
8. Test preview deployment
9. Merge to main
10. Auto-deploy to production
```

## Error Handling Strategy

### Client-Side
- Form validation errors displayed inline
- Network errors shown in toast/alert
- Loading states for all async operations
- Retry mechanisms for failed operations

### Server-Side (Convex)
- Throw descriptive errors from mutations
- Return `null` for not found in queries
- Log errors for debugging
- Never expose sensitive information

### User Experience
- Graceful degradation
- Clear error messages
- Actionable error recovery
- Offline indicators (future)

## Monitoring and Observability

### Built-in (Convex Dashboard)
- Function execution logs
- Performance metrics
- Error rates
- Database query performance

### Future Additions
- Custom analytics
- User behavior tracking
- Performance monitoring (Vercel Analytics)
- Error tracking (Sentry)

