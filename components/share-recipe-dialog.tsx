"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Share2, CheckCircle2, AlertCircle } from "lucide-react";

interface ShareRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: Id<"recipes">;
  recipeTitle: string;
  onSuccess?: (slug: string) => void;
}

export function ShareRecipeDialog({
  open,
  onOpenChange,
  recipeId,
  recipeTitle,
  onSuccess,
}: ShareRecipeDialogProps) {
  const { user } = useUser();
  const shareRecipe = useMutation(api.recipes.shareRecipe);
  
  const [shareName, setShareName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugToCheck, setSlugToCheck] = useState<string | null>(null);
  
  // Use query hook to check if slug exists (only when slugToCheck is set)
  const slugExists = useQuery(
    api.recipes.checkSlugExists,
    slugToCheck ? { slug: slugToCheck, excludeRecipeId: recipeId } : "skip"
  );

  // Initialize with suggested name when dialog opens
  useEffect(() => {
    if (open) {
      const username = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split("@")[0] || "user";
      const suggestedName = `${recipeTitle} by ${username}`;
      setShareName(suggestedName);
      setSlugToCheck(null);
    }
  }, [open, recipeTitle, user]);

  // Debounce slug checking when shareName changes
  useEffect(() => {
    if (!open || !shareName.trim()) {
      setSlugToCheck(null);
      return;
    }

    const slug = slugify(shareName);
    if (!slug) {
      setSlugToCheck(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setSlugToCheck(slug);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [shareName, open]);

  const handleShare = async () => {
    if (!shareName.trim()) {
      toast.error("Please enter a name for your shared recipe");
      return;
    }

    const slug = slugify(shareName);
    if (!slug) {
      toast.error("Please enter a valid name");
      return;
    }

    // Final check before submitting
    if (slugExists === true) {
      toast.error("This name is already taken. Please choose a different name.");
      return;
    }

    setIsSubmitting(true);
    try {
      await shareRecipe({
        id: recipeId,
        slug,
      });
      
      toast.success("Recipe shared successfully!");
      onSuccess?.(slug);
      onOpenChange(false);
      setShareName("");
      setSlugToCheck(null);
    } catch (error) {
      console.error("Error sharing recipe:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("already exists")) {
        toast.error(errorMessage);
      } else {
        toast.error(`Failed to share recipe: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const slug = shareName.trim() ? slugify(shareName) : "";
  const isCheckingSlug = slugToCheck !== null && slugExists === undefined;
  const slugError = slugExists === true ? "This name is already taken. Please choose a different name." : null;
  const isValidSlug = slug && slugExists === false && !isCheckingSlug;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Recipe
          </DialogTitle>
          <DialogDescription>
            Make your recipe public so others can find it. Choose a unique name for your shared recipe.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="shareName">Recipe Name *</Label>
            <Input
              id="shareName"
              value={shareName}
              onChange={(e) => setShareName(e.target.value)}
              placeholder="e.g., Chicken Curry by John"
              disabled={isSubmitting}
            />
            {shareName.trim() && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">URL:</span> /recipes/{slug || "..."}
              </div>
            )}
            {isCheckingSlug && slugToCheck && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking availability...
              </div>
            )}
            {slugError && slugToCheck && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {slugError}
              </div>
            )}
            {isValidSlug && slugToCheck && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                This name is available!
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setShareName("");
              setSlugToCheck(null);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSubmitting || !isValidSlug || isCheckingSlug}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share Recipe
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

