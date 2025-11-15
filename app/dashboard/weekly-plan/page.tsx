"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Loader2, Trash2, ChefHat } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function WeeklyPlansPage() {
  const plans = useQuery(api.weeklyPlans.list);
  const deletePlan = useMutation(api.weeklyPlans.remove);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{
    id: Id<"weeklyPlans">;
    weekStartDate: number;
  } | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, plan: { _id: Id<"weeklyPlans">; weekStartDate: number }) => {
    e.preventDefault();
    e.stopPropagation();
    setPlanToDelete({ id: plan._id, weekStartDate: plan.weekStartDate });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (planToDelete) {
      try {
        await deletePlan({ id: planToDelete.id });
        toast.success("Weekly plan deleted successfully");
        setDeleteDialogOpen(false);
        setPlanToDelete(null);
      } catch (error) {
        console.error("Error deleting plan:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to delete plan: ${errorMessage}`);
      }
    }
  };

  const formatWeekDate = (weekStartDate: number) => {
    const date = new Date(weekStartDate);
    const endDate = new Date(weekStartDate);
    endDate.setDate(endDate.getDate() + 6);
    
    return {
      start: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      end: endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      full: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    };
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Weekly Plans
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage all your weekly meal plans
          </p>
        </div>
        <Link href="/dashboard/weekly-plan/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Plan
          </Button>
        </Link>
      </div>

      <div>
        {plans === undefined ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading weekly plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              You haven't created any weekly plans yet.
            </p>
            <Link href="/dashboard/weekly-plan/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Plan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const weekDates = formatWeekDate(plan.weekStartDate);
              return (
                <div
                  key={plan._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow relative group flex flex-col h-full"
                >
                  <Link
                    href={`/dashboard/weekly-plan/${plan._id}`}
                    className="block flex flex-col flex-grow"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">
                        Week of {weekDates.start}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {weekDates.start} - {weekDates.end}
                    </p>
                    <div className="mt-auto">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="bg-secondary px-2 py-1 rounded">
                          {plan.recipeCount} {plan.recipeCount === 1 ? "recipe" : "recipes"}
                        </span>
                        <span className="bg-secondary px-2 py-1 rounded">
                          {7 - plan.recipeCount} empty {7 - plan.recipeCount === 1 ? "day" : "days"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(plan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteClick(e, plan)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Weekly Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this weekly plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPlanToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
