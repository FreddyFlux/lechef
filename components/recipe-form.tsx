"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";

interface RecipeFormProps {
  onSuccess?: () => void;
}

export function RecipeForm({ onSuccess }: RecipeFormProps) {
  const createRecipe = useMutation(api.recipes.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cuisine: "",
    skillLevel: "beginner",
    cookTime: "",
    prepTime: "",
    cost: "medium",
    canFreeze: false,
    canReheat: false,
    servings: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createRecipe({
        title: formData.title,
        description: formData.description || undefined,
        cuisine: formData.cuisine,
        skillLevel: formData.skillLevel,
        cookTime: parseInt(formData.cookTime) || 0,
        prepTime: parseInt(formData.prepTime) || 0,
        cost: formData.cost,
        canFreeze: formData.canFreeze,
        canReheat: formData.canReheat,
        servings: parseInt(formData.servings) || 1,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        cuisine: "",
        skillLevel: "beginner",
        cookTime: "",
        prepTime: "",
        cost: "medium",
        canFreeze: false,
        canReheat: false,
        servings: "",
      });
      
      // Close form after successful creation
      onSuccess?.();
    } catch (error) {
      console.error("Error creating recipe:", error);
      alert("Failed to create recipe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Recipe Title *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="e.g., Chicken Curry"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Optional description of your recipe"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cuisine">Cuisine *</Label>
          <Input
            id="cuisine"
            name="cuisine"
            value={formData.cuisine}
            onChange={handleChange}
            required
            placeholder="e.g., Italian, Asian, Mexican"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="skillLevel">Skill Level *</Label>
          <select
            id="skillLevel"
            name="skillLevel"
            value={formData.skillLevel}
            onChange={handleChange}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prepTime">Prep Time (minutes) *</Label>
          <Input
            id="prepTime"
            name="prepTime"
            type="number"
            value={formData.prepTime}
            onChange={handleChange}
            required
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cookTime">Cook Time (minutes) *</Label>
          <Input
            id="cookTime"
            name="cookTime"
            type="number"
            value={formData.cookTime}
            onChange={handleChange}
            required
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="servings">Servings *</Label>
          <Input
            id="servings"
            name="servings"
            type="number"
            value={formData.servings}
            onChange={handleChange}
            required
            min="1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Cost Level *</Label>
        <select
          id="cost"
          name="cost"
          value={formData.cost}
          onChange={handleChange}
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canFreeze"
            name="canFreeze"
            checked={formData.canFreeze}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="canFreeze" className="cursor-pointer">
            Can be frozen
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="canReheat"
            name="canReheat"
            checked={formData.canReheat}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="canReheat" className="cursor-pointer">
            Can be reheated
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Create Recipe
          </>
        )}
      </Button>
    </form>
  );
}

