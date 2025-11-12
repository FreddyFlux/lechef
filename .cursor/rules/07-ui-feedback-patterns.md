# UI Feedback & User Interaction Patterns

## Core Principle

**NEVER use browser native `alert()`, `confirm()`, or `prompt()` functions.** Always use shadcn components for a consistent, modern user experience.

---

## Deletion Confirmations

### ✅ Required Pattern

All deletion operations MUST use the AlertDialog component for confirmation:

```tsx
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
import { toast } from "sonner";
import { useState } from "react";

function YourComponent() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteItem = useMutation(api.yourModule.remove);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteItem({ id: item._id });
      toast.success("Item deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete [item name/description]. This action cannot be undone.
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

### Key Requirements

1. **State Management**: Use separate state for dialog open/close (`deleteDialogOpen`) and loading state (`isDeleting`)
2. **Controlled Dialog**: Always use `open` and `onOpenChange` props to control the dialog
3. **Descriptive Messages**: Include specific information about what will be deleted
4. **Destructive Styling**: Use the destructive color scheme for the delete action button
5. **Loading State**: Show loading text ("Deleting...") and disable buttons during the operation

---

## Toast Notifications (Sonner)

### ✅ Required Pattern

All data mutations (create, update, delete) MUST provide user feedback via toast notifications:

```tsx
import { toast } from "sonner";

// Success notifications
toast.success("Recipe created successfully");
toast.success("Recipe updated successfully");
toast.success("Recipe deleted successfully");
toast.success("Comment added successfully");
toast.success("Recipe added to list");

// Error notifications
toast.error(error instanceof Error ? error.message : "Failed to perform operation");

// Info notifications (when appropriate)
toast.info("Changes saved");

// Loading notifications (for long operations)
toast.loading("Processing...");
```

### When to Use Toasts

**ALWAYS use for:**
- ✅ Successful create operations
- ✅ Successful update operations
- ✅ Successful delete operations
- ✅ Failed operations (errors)
- ✅ Important state changes (like/unlike, save/unsave)

**DON'T use for:**
- ❌ Navigation actions
- ❌ Opening/closing dialogs or modals
- ❌ Validation errors (show inline instead)
- ❌ Loading states that are already visible in UI

---

## Setup Requirements

### 1. Install Dependencies

```bash
npm install sonner @radix-ui/react-alert-dialog
```

### 2. Add Toaster to Root Layout

The Toaster component MUST be included in `app/layout.tsx`:

```tsx
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
```

---

## Complete Example: Delete with Confirmation

Here's a complete example showing the full pattern:

```tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function RecipeCard({ recipe }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteRecipe = useMutation(api.recipes.remove);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteRecipe({ id: recipe._id });
      toast.success("Recipe deleted successfully");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete recipe");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{recipe.title}". This action cannot be undone.
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

---

## Other Data Mutations

### Create Operations

```tsx
async function handleCreate(data) {
  try {
    await createRecipe(data);
    toast.success("Recipe created successfully");
    // Close dialog, reset form, etc.
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Failed to create recipe");
  }
}
```

### Update Operations

```tsx
async function handleUpdate(data) {
  try {
    await updateRecipe(data);
    toast.success("Recipe updated successfully");
    // Close dialog, reset form, etc.
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Failed to update recipe");
  }
}
```

### Comment Operations

```tsx
async function handleAddComment(content: string) {
  try {
    await addComment({ recipeId, content });
    toast.success("Comment added successfully");
    // Clear comment input, refresh comments, etc.
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Failed to add comment");
  }
}
```

### Like/Save Operations

```tsx
async function handleLike(recipeId: string) {
  try {
    await toggleLike({ recipeId });
    toast.success("Recipe liked");
  } catch (error) {
    toast.error("Failed to like recipe");
  }
}

async function handleSaveToList(listId: string, recipeId: string) {
  try {
    await addRecipeToList({ listId, recipeId });
    toast.success("Recipe added to list");
  } catch (error) {
    toast.error("Failed to add recipe to list");
  }
}
```

### Bulk Operations

```tsx
async function handleBulkDelete(ids) {
  const toastId = toast.loading("Deleting recipes...");
  try {
    await bulkDelete({ ids });
    toast.success(`Successfully deleted ${ids.length} recipes`, { id: toastId });
  } catch (error) {
    toast.error("Failed to delete recipes", { id: toastId });
  }
}
```

---

## Error Handling Best Practices

1. **Specific Error Messages**: Always extract and display the actual error message when available
2. **Fallback Messages**: Provide clear fallback messages for unknown errors
3. **Context**: Include what action failed in the error message
4. **User-Friendly**: Avoid technical jargon in error messages shown to users

```tsx
// ✅ Good
toast.error(error instanceof Error ? error.message : "Failed to delete recipe");

// ❌ Bad
toast.error("Error");
alert("Something went wrong");
```

---

## Migration Checklist

When converting existing code to this pattern:

- [ ] Replace `confirm()` with `AlertDialog`
- [ ] Replace `alert()` with `toast.error()` or `toast.success()`
- [ ] Add controlled state for dialog (`deleteDialogOpen`)
- [ ] Add loading state for the operation (`isDeleting`)
- [ ] Add proper error handling with toast notifications
- [ ] Add success notifications with toast
- [ ] Test the full user flow
- [ ] Verify error cases show appropriate messages

---

## Summary

✅ **DO:**
- Use AlertDialog for all deletion confirmations
- Use toast notifications for all data mutations
- Provide specific, actionable error messages
- Show loading states during operations
- Control dialog state explicitly

❌ **DON'T:**
- Use browser native `alert()`, `confirm()`, or `prompt()`
- Leave users without feedback after actions
- Show generic error messages
- Forget to handle error cases
- Allow actions to be triggered multiple times during loading

This pattern ensures a consistent, modern, and user-friendly experience throughout the application.

