"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RecipeUrlImporterProps {
  onRecipeImported?: (recipeId: string) => void;
}

export function RecipeUrlImporter({ onRecipeImported }: RecipeUrlImporterProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const importRecipe = useAction(api.recipes.importFromUrl);

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error("Please enter a recipe URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsImporting(true);

    try {
      const recipeId = await importRecipe({
        url: url.trim(),
      });

      toast.success("Recipe imported successfully!");
      setOpen(false);
      setUrl("");

      if (onRecipeImported) {
        onRecipeImported(recipeId);
      } else {
        // Redirect to the recipe page
        window.location.href = `/dashboard/recipes/${recipeId}`;
      }
    } catch (error) {
      console.error("Error importing recipe:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to import recipe";
      toast.error(`Failed to import recipe: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Link2 className="mr-2 h-4 w-4" />
          Import from URL
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Recipe from URL</DialogTitle>
          <DialogDescription>
            Paste a URL to a recipe webpage, and we'll extract the recipe
            information for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="url">Recipe URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/recipe"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isImporting) {
                  handleImport();
                }
              }}
              disabled={isImporting}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Works with most recipe websites
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Import Recipe
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

