"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RecipeForm } from "@/components/recipe-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as Id<"recipes">;
  
  const recipe = useQuery(api.recipes.getById, { id: recipeId });
  const deleteRecipe = useMutation(api.recipes.remove);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSuccess = () => {
    router.push(`/dashboard/recipes/${recipeId}`);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recipe) return;
    setIsDeleting(true);
    try {
      await deleteRecipe({ id: recipeId });
      toast.success(`Recipe "${recipe.title}" deleted successfully`);
      setDeleteDialogOpen(false);
      router.push("/dashboard/recipes");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to delete recipe: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (recipe === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <LoadingState message="Loading recipe..." />
      </div>
    );
  }

  if (recipe === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <EmptyState
          title="Recipe Not Found"
          description="This recipe doesn't exist or you don't have permission to edit it."
          actionLabel="Back to Recipes"
          actionHref="/dashboard/recipes"
        />
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

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Recipe"
        description='Are you sure you want to delete "{name}"? This action cannot be undone.'
        itemName={recipe.title}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

