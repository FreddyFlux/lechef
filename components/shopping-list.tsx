"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface ShoppingListProps {
  planId: Id<"weeklyPlans">;
}

export function ShoppingList({ planId }: ShoppingListProps) {
  const [open, setOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const shoppingList = useQuery(
    api.weeklyPlans.generateShoppingList,
    open ? { planId } : "skip"
  );

  const toggleItem = (itemName: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  const clearChecked = () => {
    setCheckedItems(new Set());
  };

  if (!shoppingList) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Shopping List
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shopping List</DialogTitle>
            <DialogDescription>
              All ingredients needed for this weekly plan
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (shoppingList.totalItems === 0) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Shopping List
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shopping List</DialogTitle>
            <DialogDescription>
              No recipes assigned to this weekly plan yet.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Shopping List ({shoppingList.totalItems})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shopping List</DialogTitle>
          <DialogDescription>
            {shoppingList.totalItems} unique ingredients needed for this weekly
            plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {checkedItems.size > 0 && (
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="text-sm text-muted-foreground">
                {checkedItems.size} item{checkedItems.size !== 1 ? "s" : ""}{" "}
                checked
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChecked}
                className="h-7"
              >
                Clear checked
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {shoppingList.items.map((item) => {
              const isChecked = checkedItems.has(item.name);
              return (
                <div
                  key={item.name}
                  className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                    isChecked ? "bg-muted opacity-60" : "bg-background"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.name)}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isChecked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground hover:border-primary"
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-medium ${
                          isChecked ? "line-through" : ""
                        }`}
                      >
                        {item.name}
                      </h3>
                    </div>
                    {item.amount && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.amount}
                      </p>
                    )}
                    {item.recipeCount > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Used in {item.recipeCount} recipe
                        {item.recipeCount !== 1 ? "s" : ""}:{" "}
                        {item.recipes.slice(0, 2).join(", ")}
                        {item.recipes.length > 2 &&
                          ` +${item.recipes.length - 2} more`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Total: {shoppingList.totalItems} unique ingredient
              {shoppingList.totalItems !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

