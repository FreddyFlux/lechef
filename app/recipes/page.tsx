"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChefHat, Loader2, Clock, Users } from "lucide-react";
import Link from "next/link";

export default function RecipesOverviewPage() {
  const recipes = useQuery(api.recipes.listPublic);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">All Recipes</h1>
        <p className="text-muted-foreground">
          Discover delicious recipes shared by our community
        </p>
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
            <h2 className="text-2xl font-bold mb-2">No Recipes Yet</h2>
            <p className="text-muted-foreground mb-4">
              There are no public recipes available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Link
                key={recipe._id}
                href={`/recipes/${recipe.slug}`}
                className="group border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-full"
              >
                {recipe.imageUrl && (
                  <div className="relative w-full h-48 overflow-hidden bg-muted">
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {recipe.title}
                  </h3>
                  {recipe.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                      {recipe.description}
                    </p>
                  )}
                  <div className="mt-auto">
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
                      <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                        <Clock className="h-3 w-3" />
                        {recipe.prepTime + recipe.cookTime} min
                      </span>
                      <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                        <Users className="h-3 w-3" />
                        {recipe.servings}
                      </span>
                      <span className="bg-secondary px-2 py-1 rounded capitalize">
                        {recipe.skillLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

