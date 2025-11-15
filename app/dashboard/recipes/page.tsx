"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus, ChefHat, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

export default function RecipesPage() {
  const recipes = useQuery(api.recipes.list);
  const deleteRecipe = useMutation(api.recipes.remove);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<{
    id: Id<"recipes">;
    title: string;
  } | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, recipe: { _id: Id<"recipes">; title: string }) => {
    e.preventDefault();
    e.stopPropagation();
    setRecipeToDelete({ id: recipe._id, title: recipe.title });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (recipeToDelete) {
      try {
        await deleteRecipe({ id: recipeToDelete.id });
        toast.success(`Recipe "${recipeToDelete.title}" deleted successfully`);
        setDeleteDialogOpen(false);
        setRecipeToDelete(null);
      } catch (error) {
        console.error("Error deleting recipe:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to delete recipe: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Recipes</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all your recipes
          </p>
        </div>
        <Link href="/dashboard/recipes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Recipe
          </Button>
        </Link>
      </div>

      <div>
        {recipes === undefined ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading recipes...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              You haven't created any recipes yet.
            </p>
            <Link href="/dashboard/recipes/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Recipe
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <div
                key={recipe._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow relative group"
              >
                <Link
                  href={`/dashboard/recipes/${recipe._id}`}
                  className="block"
                >
                  <h3 className="font-semibold text-lg mb-2">{recipe.title}</h3>
                  {recipe.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {recipe.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Array.isArray(recipe.cuisine) ? (
                      recipe.cuisine.map((cuisine, index) => (
                        <span
                          key={index}
                          className="bg-secondary px-2 py-1 rounded text-xs"
                        >
                          {cuisine}
                        </span>
                      ))
                    ) : (
                      <span className="bg-secondary px-2 py-1 rounded text-xs">
                        {recipe.cuisine}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="bg-secondary px-2 py-1 rounded">
                      {recipe.skillLevel}
                    </span>
                    <span className="bg-secondary px-2 py-1 rounded">
                      {recipe.prepTime + recipe.cookTime} min
                    </span>
                    <span className="bg-secondary px-2 py-1 rounded">
                      {recipe.servings} servings
                    </span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteClick(e, recipe)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{recipeToDelete?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setRecipeToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

