"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RecipeForm } from "@/components/recipe-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, ChefHat, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as Id<"recipes">;
  
  const recipe = useQuery(api.recipes.getById, { id: recipeId });
  const deleteRecipe = useMutation(api.recipes.remove);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSuccess = () => {
    router.push(`/dashboard/recipes/${recipeId}`);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteRecipe({ id: recipeId });
      toast.success(`Recipe "${recipe.title}" deleted successfully`);
      setDeleteDialogOpen(false);
      router.push("/dashboard/recipes");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to delete recipe: ${errorMessage}`);
    }
  };

  if (recipe === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (recipe === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12 border rounded-lg">
          <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Recipe Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This recipe doesn't exist or you don't have permission to edit it.
          </p>
          <Link href="/dashboard/recipes">
            <Button>Back to Recipes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href={`/dashboard/recipes/${recipeId}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipe
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Recipe</h1>
            <p className="text-muted-foreground mt-2">
              Update your recipe details
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Recipe
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <RecipeForm
          recipeId={recipeId}
          initialData={{
            title: recipe.title,
            description: recipe.description,
            cuisine: recipe.cuisine,
            skillLevel: recipe.skillLevel,
            cookTime: recipe.cookTime,
            prepTime: recipe.prepTime,
            cost: recipe.cost,
            canFreeze: recipe.canFreeze,
            canReheat: recipe.canReheat,
            servings: recipe.servings,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            imageUrl: recipe.imageUrl || undefined,
          }}
          onSuccess={handleSuccess}
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{recipe.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
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

