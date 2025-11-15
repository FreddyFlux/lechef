"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useWakeLock } from "@/lib/useWakeLock";
import { 
  ChefHat, 
  Loader2, 
  Clock, 
  Users, 
  ChefHat as CookingModeIcon,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PublicRecipePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const recipe = useQuery(api.recipes.getBySlug, { slug });
  const { isSupported, isActive, error, requestWakeLock, releaseWakeLock } = useWakeLock();

  const toggleCookingMode = async () => {
    if (isActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
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
            This recipe doesn't exist or is no longer available.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
        >
          ← Back to Home
        </Link>
        {recipe.imageUrl && (
          <h1 className="text-3xl font-bold tracking-tight mb-2">{recipe.title}</h1>
        )}
      </div>

      {/* Hero Image */}
      {recipe.imageUrl && (
        <div className="mb-6 rounded-lg overflow-hidden border">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-64 md:h-96 object-cover"
          />
        </div>
      )}

      {/* Description and Cooking Mode */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4">{recipe.title}</h2>
        <div className="flex items-start justify-between flex-wrap gap-4">
          {recipe.description && (
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground">{recipe.description}</p>
            </div>
          )}
          {isSupported && (
            <div className="flex flex-col gap-2">
              <Button
                onClick={toggleCookingMode}
                variant={isActive ? "default" : "outline"}
                size="lg"
                className={isActive ? "bg-primary" : ""}
              >
                {isActive ? (
                  <>
                    <CookingModeIcon className="mr-2 h-5 w-5" />
                    Exit Cooking Mode
                  </>
                ) : (
                  <>
                    <CookingModeIcon className="mr-2 h-5 w-5" />
                    Start Cooking Mode
                  </>
                )}
              </Button>
              {error && (
                <div className="text-xs text-destructive max-w-[200px]">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recipe Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Total Time</span>
          </div>
          <p className="text-2xl font-bold">{totalTime} min</p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Prep Time</span>
          </div>
          <p className="text-2xl font-bold">{recipe.prepTime} min</p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Cook Time</span>
          </div>
          <p className="text-2xl font-bold">{recipe.cookTime} min</p>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Servings</span>
          </div>
          <p className="text-2xl font-bold">{recipe.servings}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.isArray(recipe.cuisine) ? (
          recipe.cuisine.map((cuisine, index) => (
            <span
              key={index}
              className="bg-secondary px-3 py-1 rounded-full text-sm"
            >
              {cuisine}
            </span>
          ))
        ) : (
          <span className="bg-secondary px-3 py-1 rounded-full text-sm">
            {recipe.cuisine}
          </span>
        )}
        <span className="bg-secondary px-3 py-1 rounded-full text-sm capitalize">
          {recipe.skillLevel}
        </span>
        <span className="bg-secondary px-3 py-1 rounded-full text-sm capitalize">
          {recipe.cost} cost
        </span>
        {recipe.canFreeze && (
          <span className="bg-secondary px-3 py-1 rounded-full text-sm">
            Freezable
          </span>
        )}
        {recipe.canReheat && (
          <span className="bg-secondary px-3 py-1 rounded-full text-sm">
            Reheatable
          </span>
        )}
      </div>

      {/* Ingredients */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Ingredients</h2>
          <ul className="space-y-2 border rounded-lg p-6 bg-muted/30">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5 flex-shrink-0">•</span>
                <span className="flex-1">
                  {ingredient.amount && `${ingredient.amount} `}
                  {ingredient.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Cooking Steps */}
      {recipe.steps && recipe.steps.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Instructions</h2>
          <ol className="space-y-4 border rounded-lg p-6 bg-muted/30">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="font-bold text-lg text-primary flex-shrink-0 min-w-[2rem]">
                  {step.stepNumber || index + 1}.
                </span>
                <span className="flex-1 text-base leading-relaxed">
                  {step.instruction}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Cooking Mode Indicator */}
      {isActive && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <CookingModeIcon className="h-5 w-5 animate-pulse" />
          <span className="font-medium">Cooking Mode Active</span>
        </div>
      )}
    </div>
  );
}

