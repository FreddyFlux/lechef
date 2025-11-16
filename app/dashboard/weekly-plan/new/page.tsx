"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { 
  Calendar, 
  Search, 
  X, 
  ChefHat, 
  Loader2,
  Clock,
  Users,
  Plus,
  ArrowLeft,
  Edit,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WeeklyPlanGenerator } from "@/components/weekly-plan-generator";
import type { RecipeSearchResult } from "@/lib/types";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function NewWeeklyPlanPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;

    setCurrent(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);
  const [weekStartDate, setWeekStartDate] = useState(() => {
    // Default to current week start
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0]; // Format as YYYY-MM-DD for input
  });
  
  const searchResults = useQuery(
    api.recipes.search,
    searchQuery.trim() ? { searchQuery: searchQuery.trim(), limit: 20 } : "skip"
  );
  const updateWeek = useMutation(api.weeklyPlans.updateWeek);

  // Convert date string to timestamp
  const weekStartTimestamp = useMemo(() => {
    const date = new Date(weekStartDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
  }, [weekStartDate]);

  // Initialize days array
  const [days, setDays] = useState<Array<{ dayOfWeek: number; recipeId?: Id<"recipes"> }>>(
    Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i }))
  );

  const handleAssignRecipe = async (recipeId: Id<"recipes">, dayOfWeek: number, recipeData?: RecipeSearchResult) => {
    try {
      const updatedDays = days.map((day) => {
        if (day.dayOfWeek === dayOfWeek) {
          return { dayOfWeek: day.dayOfWeek, recipeId };
        }
        return day;
      }).sort((a, b) => a.dayOfWeek - b.dayOfWeek);

      setDays(updatedDays);
      
      // Cache recipe details if provided (from search results)
      if (recipeData) {
        setRecipeDetailsMap(prev => {
          const newMap = new Map(prev);
          newMap.set(recipeId, recipeData);
          return newMap;
        });
      }
      
      // Save to database
      await updateWeek({
        weekStartDate: weekStartTimestamp,
        days: updatedDays,
      });

      toast.success("Recipe assigned to day");
      setSelectedDay(null);
      setShowSearch(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Error assigning recipe:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to assign recipe: ${errorMessage}`);
    }
  };

  const handleRemoveRecipe = (dayOfWeek: number) => {
    const updatedDays = days.map((day) => {
      if (day.dayOfWeek === dayOfWeek) {
        return { dayOfWeek: day.dayOfWeek };
      }
      return day;
    });
    setDays(updatedDays);
    toast.success("Recipe removed from day");
  };

  const handleSave = async () => {
    try {
      await updateWeek({
        weekStartDate: weekStartTimestamp,
        days: days.sort((a, b) => a.dayOfWeek - b.dayOfWeek),
      });

      toast.success("Weekly plan created successfully");
      router.push("/dashboard/weekly-plan");
    } catch (error) {
      console.error("Error saving plan:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to save plan: ${errorMessage}`);
    }
  };

  const formatDate = (dayIndex: number) => {
    const date = new Date(weekStartTimestamp);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Store recipe details for immediate display
  const [recipeDetailsMap, setRecipeDetailsMap] = useState<Map<Id<"recipes">, RecipeSearchResult>>(new Map());

  // Fetch saved plan to get recipe details after save
  const savedPlan = useQuery(
    api.weeklyPlans.getWeek,
    { weekStartDate: weekStartTimestamp }
  );

  // Merge local state with saved data and cached recipe details
  const displayDays = useMemo(() => {
    return days.map(day => {
      if (!day.recipeId) {
        return { ...day, recipe: null };
      }
      
      // First try cached recipe details (from search results)
      const cachedRecipe = recipeDetailsMap.get(day.recipeId);
      if (cachedRecipe) {
        return { ...day, recipe: cachedRecipe };
      }
      
      // Then try saved plan
      const savedDay = savedPlan?.days.find(d => d.dayOfWeek === day.dayOfWeek && d.recipeId === day.recipeId);
      if (savedDay?.recipe) {
        return { ...day, recipe: savedDay.recipe };
      }
      
      // Otherwise return without recipe details (will be fetched after save)
      return { ...day, recipe: null };
    });
  }, [days, savedPlan, recipeDetailsMap]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Link href="/dashboard/weekly-plan">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Weekly Plans
          </Button>
        </Link>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Create New Weekly Plan
            </h1>
            <p className="text-muted-foreground mt-2">
              Plan your meals for the week
            </p>
          </div>
          <div className="flex items-center gap-2">
            <WeeklyPlanGenerator
              weekStartDate={weekStartTimestamp}
              onPlanGenerated={() => {
                router.push("/dashboard/weekly-plan");
              }}
            />
            <Button onClick={handleSave}>
              Save Plan
            </Button>
          </div>
        </div>

        {/* Week Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Week Start Date</label>
          <Input
            type="date"
            value={weekStartDate}
            onChange={(e) => setWeekStartDate(e.target.value)}
            className="max-w-xs"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Week of {new Date(weekStartTimestamp).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Weekly Plan Carousel */}
      <div className="w-full max-w-6xl mx-auto mb-8 relative">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: "center",
            loop: false,
            slidesToScroll: 1,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {displayDays.map((day, index) => (
              <CarouselItem key={day.dayOfWeek} className="pl-2 md:pl-4 basis-full md:basis-1/3">
                <div 
                  className={`rounded-lg p-6 flex flex-col min-h-[500px] bg-card transition-all duration-300 ${
                    index === current 
                      ? "border-2 border-primary shadow-lg z-10" 
                      : "border border-border"
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-2xl mb-1">
                      {DAY_NAMES[day.dayOfWeek]}
                    </h3>
                    <p className="text-sm text-muted-foreground">{formatDate(day.dayOfWeek)}</p>
                  </div>

                  {day.recipe ? (
                    <div className="flex-1 flex flex-col">
                      <div className="relative mb-4 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                        {day.recipe.imageUrl ? (
                          <img
                            src={day.recipe.imageUrl}
                            alt={day.recipe.title}
                            className="w-full h-48 object-cover"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted flex items-center justify-center">
                            <ChefHat className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-xl mb-2">{day.recipe.title}</h4>
                      {day.recipe.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {day.recipe.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-4 text-sm text-muted-foreground">
                        <span className="bg-secondary px-3 py-1 rounded flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {day.recipe.prepTime + day.recipe.cookTime} min
                        </span>
                        <span className="bg-secondary px-3 py-1 rounded flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {day.recipe.servings}
                        </span>
                      </div>
                      <div className="mt-auto flex gap-2">
                        <Link
                          href={day.recipe.isOwnRecipe 
                            ? `/dashboard/recipes/${day.recipe._id}`
                            : `/recipes/${day.recipe.slug || ""}`
                          }
                          className="flex-1"
                        >
                          <Button variant="outline" className="w-full">
                            View Recipe
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedDay(day.dayOfWeek);
                            setShowSearch(true);
                          }}
                          title="Change recipe"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveRecipe(day.dayOfWeek)}
                          title="Remove recipe"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
                      <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center mb-4">
                        No recipe assigned
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedDay(day.dayOfWeek);
                          setShowSearch(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Recipe
                      </Button>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-12" />
          <CarouselNext className="-right-12" />
        </Carousel>
      </div>

      {/* Weekly Summary List */}
      <div className="mt-8 w-full max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Week Summary</h2>
        <div className="border rounded-lg divide-y">
          {displayDays.map((day) => {
            const date = new Date(weekStartTimestamp);
            date.setDate(date.getDate() + day.dayOfWeek);
            const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            
            return (
              <div key={day.dayOfWeek} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-24 text-sm font-medium text-muted-foreground">
                      {DAY_NAMES[day.dayOfWeek]}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formattedDate}
                    </div>
                    <div className="flex-1">
                      {day.recipe ? (
                        <Link
                          href={day.recipe.isOwnRecipe 
                            ? `/dashboard/recipes/${day.recipe._id}`
                            : `/recipes/${day.recipe.slug || ""}`
                          }
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {day.recipe.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground italic">No recipe assigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search Dialog */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {selectedDay !== null ? `Add Recipe for ${DAY_NAMES[selectedDay]}` : "Search Recipes"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                  setSelectedDay(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipes by name, cuisine, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {!searchQuery.trim() ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Search for recipe</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    You can search for any recipe that you have created or the shared public recipes. You can find recipes by using their name or searching for categories.
                  </p>
                </div>
              ) : searchResults === undefined ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Searching recipes...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <ChefHat className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No recipes found. Try a different search term.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((recipe) => (
                    <div
                      key={recipe._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        if (selectedDay !== null) {
                          handleAssignRecipe(recipe._id, selectedDay, recipe);
                        }
                      }}
                    >
                      <div className="flex gap-4">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                          {recipe.imageUrl ? (
                            <img
                              src={recipe.imageUrl}
                              alt={recipe.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ChefHat className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold line-clamp-1">{recipe.title}</h3>
                            {recipe.isOwnRecipe && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex-shrink-0">
                                Your Recipe
                              </span>
                            )}
                          </div>
                          {recipe.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {recipe.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="bg-secondary px-2 py-1 rounded">
                              {recipe.prepTime + recipe.cookTime} min
                            </span>
                            <span className="bg-secondary px-2 py-1 rounded">
                              {recipe.servings} servings
                            </span>
                            {recipe.cuisine.slice(0, 2).map((c: string, i: number) => (
                              <span key={i} className="bg-secondary px-2 py-1 rounded">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

