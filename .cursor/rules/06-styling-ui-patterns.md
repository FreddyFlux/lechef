# Styling and UI Patterns

## Tailwind CSS Standards

### Utility-First Approach
Always use Tailwind utility classes for styling. Avoid writing custom CSS unless absolutely necessary.

```typescript
// ✅ Good - Tailwind utilities
<div className="flex items-center justify-between p-4 rounded-lg border bg-white">
  <h2 className="text-xl font-semibold">Recipe</h2>
</div>

// ❌ Bad - Custom CSS
<div className="custom-card">
  <h2 className="custom-heading">Recipe</h2>
</div>
```

### Class Organization
Order classes logically:
1. Layout (flex, grid, block)
2. Positioning (relative, absolute)
3. Display & Box Model (w-, h-, p-, m-)
4. Typography (text-, font-)
5. Visual (bg-, border-, shadow-)
6. Interactive (hover:, focus:, active:)
7. Responsive (sm:, md:, lg:)

```typescript
<button className="
  flex items-center justify-center
  w-full h-12
  px-4 py-2
  text-sm font-medium
  bg-primary text-primary-foreground
  rounded-md border
  hover:bg-primary/90
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  md:w-auto
">
  Submit
</button>
```

### Use cn Utility (Tailwind Merge)
```typescript
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
}

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md",
        variant === "default" && "bg-primary text-primary-foreground",
        variant === "outline" && "border border-primary text-primary",
        className
      )}
      {...props}
    />
  );
}
```

## Responsive Design

### Mobile-First Approach
Always design for mobile first, then add larger breakpoints.

```typescript
<div className="
  grid grid-cols-1
  gap-4
  sm:grid-cols-2
  md:grid-cols-3
  lg:grid-cols-4
">
  {/* Recipe Cards */}
</div>
```

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Layout Patterns

### Container
```typescript
<div className="container mx-auto px-4 py-8">
  {/* Content */}
</div>
```

### Centered Content
```typescript
<div className="flex items-center justify-center min-h-screen">
  <div className="w-full max-w-md">
    {/* Centered content */}
  </div>
</div>
```

### Recipe Card Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {recipes.map(recipe => (
    <RecipeCard key={recipe._id} recipe={recipe} />
  ))}
</div>
```

## Typography

### Headings
```typescript
<h1 className="text-4xl font-bold tracking-tight">Recipe Collection</h1>
<h2 className="text-3xl font-semibold">Recipe Title</h2>
<h3 className="text-2xl font-semibold">Ingredients</h3>
<h4 className="text-xl font-medium">Step 1</h4>
```

### Body Text
```typescript
<p className="text-base leading-7">Regular paragraph text</p>
<p className="text-sm text-muted-foreground">Recipe description or metadata</p>
<p className="text-xs text-muted-foreground">Small print or timestamps</p>
```

## Color System (shadcn/ui)

### Use CSS Variables
The app uses CSS variables for theming. Reference these in Tailwind:

```typescript
// Background colors
<div className="bg-background">Default background</div>
<div className="bg-card">Card background</div>
<div className="bg-muted">Muted background</div>
<div className="bg-primary">Primary color</div>

// Text colors
<span className="text-foreground">Default text</span>
<span className="text-muted-foreground">Muted text</span>
<span className="text-primary-foreground">Text on primary</span>

// Borders
<div className="border border-border">Default border</div>
<div className="border border-input">Input border</div>
```

## Dark Mode

### Theme Toggle
Use the ThemeProvider from `next-themes` (already set up):

```typescript
"use client"

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

## Icon Usage (Lucide React)

### Import Icons
```typescript
import { 
  ChefHat, 
  Plus, 
  Edit, 
  Trash2, 
  Heart,
  Bookmark,
  Clock,
  DollarSign,
  MessageSquare,
  ChevronRight
} from "lucide-react";

<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Recipe
</Button>
```

### Icon Sizing
```typescript
<Icon className="h-4 w-4" /> // Small (16px)
<Icon className="h-5 w-5" /> // Medium (20px)
<Icon className="h-6 w-6" /> // Large (24px)
<Icon className="h-8 w-8" /> // Extra Large (32px)
```

## Card Patterns

### Recipe Card
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

<Card>
  <CardHeader>
    <CardTitle>Chicken Curry</CardTitle>
    <CardDescription>
      <Badge>{recipe.cuisine}</Badge>
      <Badge variant="outline">{recipe.skillLevel}</Badge>
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        {recipe.cookTime} min
      </span>
      <span className="flex items-center gap-1">
        <DollarSign className="h-4 w-4" />
        {recipe.cost}
      </span>
    </div>
  </CardContent>
</Card>
```

### Interactive Card
```typescript
<Card className="
  cursor-pointer 
  transition-colors
  hover:bg-accent
  focus:outline-none focus:ring-2 focus:ring-ring
">
  {/* Card content */}
</Card>
```

## Form Styling

### Input Groups
```typescript
<div className="space-y-2">
  <Label htmlFor="title">Recipe Title</Label>
  <Input 
    id="title" 
    placeholder="Enter recipe title"
    className="w-full"
  />
  <p className="text-sm text-muted-foreground">
    Choose a descriptive title for your recipe
  </p>
</div>
```

### Form Layout
```typescript
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-2">
      <Label>Cook Time (minutes)</Label>
      <Input type="number" />
    </div>
    <div className="space-y-2">
      <Label>Prep Time (minutes)</Label>
      <Input type="number" />
    </div>
  </div>
  
  <div className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button type="submit">Save</Button>
  </div>
</form>
```

## List Patterns

### Ingredient List
```typescript
<div className="space-y-2">
  {ingredients.map((ingredient, index) => (
    <div key={index} className="
      flex items-center justify-between
      p-3 rounded-lg border
      hover:bg-accent
    ">
      <span>{ingredient.amount} {ingredient.name}</span>
    </div>
  ))}
</div>
```

### Step List
```typescript
<div className="space-y-4">
  {steps.map((step, index) => (
    <div key={index} className="
      flex gap-4
      p-4 rounded-lg border
    ">
      <div className="
        flex items-center justify-center
        w-8 h-8 rounded-full
        bg-primary text-primary-foreground
        font-semibold
      ">
        {step.stepNumber}
      </div>
      <p className="flex-1">{step.instruction}</p>
    </div>
  ))}
</div>
```

## Badge and Status Indicators

### Recipe Metadata Badges
```typescript
import { Badge } from "@/components/ui/badge";

<Badge variant="default">{recipe.cuisine}</Badge>
<Badge variant="secondary">{recipe.skillLevel}</Badge>
<Badge variant="outline">{recipe.cost}</Badge>
```

## Spacing Guidelines

### Consistent Spacing Scale
- `gap-1`: 4px
- `gap-2`: 8px
- `gap-4`: 16px (most common)
- `gap-6`: 24px
- `gap-8`: 32px

### Padding/Margin
- Small: `p-2` or `m-2` (8px)
- Medium: `p-4` or `m-4` (16px)
- Large: `p-6` or `m-6` (24px)
- Extra Large: `p-8` or `m-8` (32px)

## Accessibility

### Focus States
Always provide visible focus indicators:

```typescript
<button className="
  focus:outline-none 
  focus:ring-2 
  focus:ring-ring 
  focus:ring-offset-2
">
  Button
</button>
```

### Screen Reader Only Text
```typescript
<span className="sr-only">Text for screen readers</span>
```

### Semantic Colors
Use semantic color names from the theme system rather than arbitrary colors to ensure proper contrast in both light and dark modes.

```typescript
// ✅ Good - Semantic colors
<div className="bg-primary text-primary-foreground">Primary</div>
<div className="bg-destructive text-destructive-foreground">Error</div>

// ❌ Bad - Arbitrary colors might not have proper contrast
<div className="bg-blue-500 text-white">Primary</div>
<div className="bg-red-500 text-white">Error</div>
```

