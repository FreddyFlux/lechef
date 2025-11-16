"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Trash2 } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { LoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { formatWeekDateRange } from "@/lib/date-utils";

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

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (planToDelete) {
      setIsDeleting(true);
      try {
        await deletePlan({ id: planToDelete.id });
        toast.success("Weekly plan deleted successfully");
        setDeleteDialogOpen(false);
        setPlanToDelete(null);
      } catch (error) {
        console.error("Error deleting plan:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to delete plan: ${errorMessage}`);
      } finally {
        setIsDeleting(false);
      }
    }
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
          <LoadingState message="Loading weekly plans..." />
        ) : plans.length === 0 ? (
          <EmptyState
            title="No weekly plans yet"
            description="You haven't created any weekly plans yet."
            actionLabel="Create Your First Plan"
            actionHref="/dashboard/weekly-plan/new"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const weekDates = formatWeekDateRange(plan.weekStartDate);
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

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setPlanToDelete(null);
        }}
        title="Delete Weekly Plan"
        description="Are you sure you want to delete this weekly plan? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
