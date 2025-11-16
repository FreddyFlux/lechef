"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AIRecipeGeneratorProps {
  onRecipeGenerated?: (recipeId: string) => void;
}

export function AIRecipeGenerator({ onRecipeGenerated }: AIRecipeGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState({
    cuisine: [] as string[],
    dietaryRestrictions: [] as string[],
    skillLevel: "",
    maxCookTime: undefined as number | undefined,
    servings: undefined as number | undefined,
  });

  const generateRecipe = useAction(api.recipes.generateFromPrompt);

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 3) {
      toast.error("Please enter a recipe description (at least 3 characters)");
      return;
    }

    setIsGenerating(true);

    try {
      const recipeId = await generateRecipe({
        prompt: prompt.trim(),
        preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
      });

      toast.success("Recipe generated successfully!");
      setOpen(false);
      setPrompt("");
      setPreferences({
        cuisine: [],
        dietaryRestrictions: [],
        skillLevel: "",
        maxCookTime: undefined,
        servings: undefined,
      });

      if (onRecipeGenerated) {
        onRecipeGenerated(recipeId);
      } else {
        // Redirect to the recipe page
        window.location.href = `/dashboard/recipes/${recipeId}`;
      }
    } catch (error) {
      console.error("Error generating recipe:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate recipe";
      toast.error(`Failed to generate recipe: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const addCuisine = () => {
    const input = document.getElementById("cuisine-input") as HTMLInputElement;
    if (input?.value.trim()) {
      setPreferences({
        ...preferences,
        cuisine: [...preferences.cuisine, input.value.trim()],
      });
      input.value = "";
    }
  };

  const removeCuisine = (index: number) => {
    setPreferences({
      ...preferences,
      cuisine: preferences.cuisine.filter((_, i) => i !== index),
    });
  };

  const addDietaryRestriction = () => {
    const input = document.getElementById(
      "dietary-input"
    ) as HTMLInputElement;
    if (input?.value.trim()) {
      setPreferences({
        ...preferences,
        dietaryRestrictions: [
          ...preferences.dietaryRestrictions,
          input.value.trim(),
        ],
      });
      input.value = "";
    }
  };

  const removeDietaryRestriction = (index: number) => {
    setPreferences({
      ...preferences,
      dietaryRestrictions: preferences.dietaryRestrictions.filter(
        (_, i) => i !== index
      ),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Recipe with AI</DialogTitle>
          <DialogDescription>
            Describe the recipe you want to create, and AI will generate it for
            you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt">Recipe Description</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., A healthy Mediterranean pasta dish with tomatoes and olives, serves 4, takes 30 minutes"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              disabled={isGenerating}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Be as specific as possible for best results
            </p>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-sm">Preferences (Optional)</h3>

            <div>
              <Label htmlFor="cuisine-input">Cuisine</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="cuisine-input"
                  placeholder="e.g., Italian, Mexican"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCuisine();
                    }
                  }}
                  disabled={isGenerating}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCuisine}
                  disabled={isGenerating}
                >
                  Add
                </Button>
              </div>
              {preferences.cuisine.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.cuisine.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => removeCuisine(i)}
                        className="hover:text-destructive"
                        disabled={isGenerating}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="dietary-input">Dietary Restrictions</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="dietary-input"
                  placeholder="e.g., vegetarian, gluten-free"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDietaryRestriction();
                    }
                  }}
                  disabled={isGenerating}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDietaryRestriction}
                  disabled={isGenerating}
                >
                  Add
                </Button>
              </div>
              {preferences.dietaryRestrictions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.dietaryRestrictions.map((d, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                    >
                      {d}
                      <button
                        type="button"
                        onClick={() => removeDietaryRestriction(i)}
                        className="hover:text-destructive"
                        disabled={isGenerating}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="skill-level">Skill Level</Label>
                <select
                  id="skill-level"
                  value={preferences.skillLevel}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      skillLevel: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isGenerating}
                >
                  <option value="">Any</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  placeholder="e.g., 4"
                  value={preferences.servings || ""}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      servings: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="max-cook-time">Max Cook Time (minutes)</Label>
              <Input
                id="max-cook-time"
                type="number"
                min="1"
                placeholder="e.g., 30"
                value={preferences.maxCookTime || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    maxCookTime: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Recipe
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

