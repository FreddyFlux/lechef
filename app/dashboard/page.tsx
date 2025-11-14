"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { RecipeForm } from "@/components/recipe-form";
import { Button } from "@/components/ui/button";
import { Plus, ChefHat, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const recipes = useQuery(api.recipes.list);
  const [showForm, setShowForm] = useState(false);


  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your recipes
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Recipe
          </Button>
        )}
      </div>

      {showForm ? (
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Create New Recipe</h2>
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
          <RecipeForm onSuccess={() => setShowForm(false)} />
        </div>
      ) : null}

      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Recipes</h2>
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
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Recipe
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <div
                key={recipe._id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-lg mb-2">{recipe.title}</h3>
                {recipe.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="bg-secondary px-2 py-1 rounded">
                    {recipe.cuisine}
                  </span>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

