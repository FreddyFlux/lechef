"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, X, ArrowRight, Move, Save } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface RecipeFormProps {
  onSuccess?: () => void;
  recipeId?: Id<"recipes">;
  initialData?: {
    title: string;
    description?: string;
    cuisine: string[];
    skillLevel: string;
    cookTime: number;
    prepTime: number;
    cost: string;
    canFreeze: boolean;
    canReheat: boolean;
    servings: number;
    ingredients?: Array<{ name: string; amount?: string }>;
    steps?: Array<{ instruction: string; stepNumber?: number }>;
  };
}

interface SortableIngredientItemProps {
  id: string;
  ingredient: string;
  index: number;
  onRemove: (index: number) => void;
}

interface SortableStepItemProps {
  id: string;
  step: string;
  index: number;
  onRemove: (index: number) => void;
}

function SortableIngredientItem({ id, ingredient, index, onRemove }: SortableIngredientItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 group"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
        aria-label="Drag to reorder"
      >
        <Move className="h-4 w-4" />
      </button>
      <span className="text-muted-foreground mt-0.5 flex-shrink-0">•</span>
      <span className="flex-1">{ingredient}</span>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-primary hover:text-destructive transition-colors flex-shrink-0 p-1 hover:bg-destructive/10 rounded"
        aria-label="Remove ingredient"
      >
        <X className="h-5 w-5" />
      </button>
    </li>
  );
}

function SortableStepItem({ id, step, index, onRemove }: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 group"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
        aria-label="Drag to reorder"
      >
        <Move className="h-4 w-4" />
      </button>
      <span className="text-muted-foreground font-medium flex-shrink-0 min-w-[1.5rem]">{index + 1}.</span>
      <span className="flex-1">{step}</span>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="text-primary hover:text-destructive transition-colors flex-shrink-0 p-1 hover:bg-destructive/10 rounded"
        aria-label="Remove step"
      >
        <X className="h-5 w-5" />
      </button>
    </li>
  );
}

export function RecipeForm({ onSuccess, recipeId, initialData }: RecipeFormProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const createRecipe = useMutation(api.recipes.create);
  const updateRecipe = useMutation(api.recipes.update);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cuisineTags, setCuisineTags] = useState<string[]>([]);
  const [cuisineInput, setCuisineInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [stepInput, setStepInput] = useState("");
  
  const isEditing = !!recipeId && !!initialData;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndIngredients = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setIngredients((items) => {
        const oldIndex = items.findIndex((_, i) => `ingredient-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `ingredient-${i}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragEndSteps = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((_, i) => `step-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `step-${i}` === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skillLevel: "beginner",
    cookTime: "",
    prepTime: "",
    cost: "medium",
    canFreeze: false,
    canReheat: false,
    servings: "",
  });

  // Populate form when initialData is provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || "",
        skillLevel: initialData.skillLevel,
        cookTime: initialData.cookTime.toString(),
        prepTime: initialData.prepTime.toString(),
        cost: initialData.cost,
        canFreeze: initialData.canFreeze,
        canReheat: initialData.canReheat,
        servings: initialData.servings.toString(),
      });
      
      setCuisineTags(initialData.cuisine || []);
      
      if (initialData.ingredients) {
        setIngredients(
          initialData.ingredients.map((ing) => 
            ing.amount ? `${ing.amount} ${ing.name}` : ing.name
          )
        );
      }
      
      if (initialData.steps) {
        setSteps(initialData.steps.map((step) => step.instruction));
      }
    }
  }, [initialData]);

  const handleAddCuisine = () => {
    const trimmed = cuisineInput.trim().toLowerCase();
    if (trimmed && !cuisineTags.includes(trimmed)) {
      setCuisineTags([...cuisineTags, trimmed]);
      setCuisineInput("");
    }
  };

  const handleRemoveCuisine = (tagToRemove: string) => {
    setCuisineTags(cuisineTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCuisine();
    }
  };

  const handleAddIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput("");
    }
  };

  const handleRemoveIngredient = (indexToRemove: number) => {
    setIngredients(ingredients.filter((_, index) => index !== indexToRemove));
  };

  const handleIngredientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleAddStep = () => {
    const trimmed = stepInput.trim();
    if (trimmed) {
      // Remove leading number and period if present (e.g., "1. " or "1.")
      const cleanedStep = trimmed.replace(/^\d+\.\s*/, "");
      setSteps([...steps, cleanedStep]);
      setStepInput("");
    }
  };

  const handleRemoveStep = (indexToRemove: number) => {
    setSteps(steps.filter((_, index) => index !== indexToRemove));
  };

  const handleStepKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddStep();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) {
      toast.error("Please wait while we verify your authentication.");
      return;
    }
    
    if (!isSignedIn) {
      toast.error("You must be signed in to create a recipe. Please sign in and try again.");
      return;
    }
    
    if (cuisineTags.length === 0) {
      toast.error("Please add at least one cuisine tag.");
      return;
    }

    setIsSubmitting(true);

    try {
      const recipeData = {
        title: formData.title,
        description: formData.description || undefined,
        cuisine: cuisineTags,
        skillLevel: formData.skillLevel,
        cookTime: parseInt(formData.cookTime) || 0,
        prepTime: parseInt(formData.prepTime) || 0,
        cost: formData.cost,
        canFreeze: formData.canFreeze,
        canReheat: formData.canReheat,
        servings: parseInt(formData.servings) || 1,
        ingredients: ingredients,
        steps: steps,
      };

      if (isEditing && recipeId) {
        await updateRecipe({
          id: recipeId,
          ...recipeData,
        });
        toast.success("Recipe updated successfully!");
      } else {
        await createRecipe(recipeData);
        toast.success("Recipe created successfully!");
        
        // Reset form only after creation
        setFormData({
          title: "",
          description: "",
          skillLevel: "beginner",
          cookTime: "",
          prepTime: "",
          cost: "medium",
          canFreeze: false,
          canReheat: false,
          servings: "",
        });
        setCuisineTags([]);
        setCuisineInput("");
        setIngredients([]);
        setIngredientInput("");
        setSteps([]);
        setStepInput("");
      }
      
      // Call success callback
      onSuccess?.();
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} recipe:`, error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Not authenticated")) {
        toast.error("Authentication error. Please sign out and sign back in, then try again.");
      } else {
        toast.error(`Failed to ${isEditing ? "update" : "create"} recipe: ${errorMessage}`);
      }
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

      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <div className="flex gap-2">
          <Input
            id="ingredients"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={handleIngredientKeyDown}
            placeholder="e.g., 1kg chuck roast"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddIngredient}
            disabled={!ingredientInput.trim()}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {ingredients.length > 0 && (
          <div className="mt-3 space-y-2 border rounded-md p-4 bg-muted/30">
            <p className="text-sm font-medium text-muted-foreground mb-2">Ingredients List:</p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndIngredients}
            >
              <SortableContext
                items={ingredients.map((_, i) => `ingredient-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <SortableIngredientItem
                      key={`ingredient-${index}`}
                      id={`ingredient-${index}`}
                      ingredient={ingredient}
                      index={index}
                      onRemove={handleRemoveIngredient}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="steps">Cooking Steps</Label>
        <div className="flex gap-2">
          <Input
            id="steps"
            value={stepInput}
            onChange={(e) => setStepInput(e.target.value)}
            onKeyDown={handleStepKeyDown}
            placeholder='e.g., Cut the meat into "thumb-size" cubes'
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddStep}
            disabled={!stepInput.trim()}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {steps.length > 0 && (
          <div className="mt-3 space-y-2 border rounded-md p-4 bg-muted/30">
            <p className="text-sm font-medium text-muted-foreground mb-2">Cooking Instructions:</p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndSteps}
            >
              <SortableContext
                items={steps.map((_, i) => `step-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                <ol className="space-y-2">
                  {steps.map((step, index) => (
                    <SortableStepItem
                      key={`step-${index}`}
                      id={`step-${index}`}
                      step={step}
                      index={index}
                      onRemove={handleRemoveStep}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cuisine">Cuisine Tags *</Label>
          <div className="flex gap-2">
            <Input
              id="cuisine"
              value={cuisineInput}
              onChange={(e) => setCuisineInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., italian, pasta"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleAddCuisine}
              disabled={!cuisineInput.trim()}
            >
              Add
            </Button>
          </div>
          {cuisineTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {cuisineTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveCuisine(tag)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
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
            {isEditing ? "Saving..." : "Creating..."}
          </>
        ) : (
          <>
            {isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Recipe
              </>
            )}
          </>
        )}
      </Button>
    </form>
  );
}

