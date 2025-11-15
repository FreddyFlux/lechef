"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
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
  ChefHat, 
  Loader2,
  ArrowLeft,
  Edit,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklyPlanDetailPage() {
  const params = useParams();
  const planId = params.id as Id<"weeklyPlans">;
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  
  const plan = useQuery(api.weeklyPlans.getById, { id: planId });

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const formatDate = (dayIndex: number) => {
    if (!plan) return "";
    const date = new Date(plan.weekStartDate);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatWeekDate = () => {
    if (!plan) return "";
    const date = new Date(plan.weekStartDate);
    const endDate = new Date(plan.weekStartDate);
    endDate.setDate(endDate.getDate() + 6);
    
    return {
      start: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      end: endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    };
  };

  if (plan === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading weekly plan...</p>
        </div>
      </div>
    );
  }

  if (plan === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12 border rounded-lg">
          <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Plan Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This weekly plan doesn't exist or you don't have permission to view it.
          </p>
          <Link href="/dashboard/weekly-plan">
            <Button>Back to Weekly Plans</Button>
          </Link>
        </div>
      </div>
    );
  }

  const weekDates = formatWeekDate();
  const recipeCount = plan.days.filter((day) => day.recipe !== null).length;

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
              Weekly Plan
            </h1>
            <p className="text-muted-foreground mt-2">
              {weekDates.start} - {weekDates.end}
            </p>
          </div>
          <Link href={`/dashboard/weekly-plan/${planId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Plan
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
          <span className="bg-secondary px-3 py-1 rounded">
            {recipeCount} {recipeCount === 1 ? "recipe" : "recipes"}
          </span>
          <span className="bg-secondary px-3 py-1 rounded">
            {7 - recipeCount} empty {7 - recipeCount === 1 ? "day" : "days"}
          </span>
        </div>
      </div>

      {/* Weekly Plan Carousel */}
      <div className="w-full max-w-6xl mx-auto relative">
        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: false,
            slidesToScroll: 1,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {plan.days.map((day, index) => (
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
                      <div className="mt-auto">
                        <Link
                          href={day.recipe.isOwnRecipe 
                            ? `/dashboard/recipes/${day.recipe._id}`
                            : `/recipes/${day.recipe.slug || ""}`
                          }
                          className="block"
                        >
                          <Button variant="outline" className="w-full">
                            View Recipe
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
                      <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No recipe assigned
                      </p>
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
          {plan.days.map((day) => {
            const date = new Date(plan.weekStartDate);
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
    </div>
  );
}

