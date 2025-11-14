"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus, ChefHat, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RecipesPage() {
  const recipes = useQuery(api.recipes.list);

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
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

