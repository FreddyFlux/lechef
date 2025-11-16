"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WeeklyPlanGeneratorProps {
  weekStartDate: number;
  onPlanGenerated?: (planId: string) => void;
}

export function WeeklyPlanGenerator({
  weekStartDate,
  onPlanGenerated,
}: WeeklyPlanGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");

  const generatePlan = useAction(api.weeklyPlans.generatePlan);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter your preferences");
      return;
    }

    setIsGenerating(true);

    try {
      const planId = await generatePlan({
        weekStartDate,
        prompt: prompt.trim(),
      });

      toast.success("Weekly plan generated successfully!");
      setOpen(false);
      setPrompt("");

      if (onPlanGenerated) {
        onPlanGenerated(planId);
      } else {
        // Redirect to the weekly plan page
        window.location.href = `/dashboard/weekly-plan`;
      }
    } catch (error) {
      console.error("Error generating weekly plan:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate weekly plan";
      toast.error(`Failed to generate weekly plan: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Plan with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Weekly Plan with AI</DialogTitle>
          <DialogDescription>
            Describe your preferences and AI will create a complete weekly meal plan with 7 different recipes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferences-prompt">Your Preferences</Label>
            <Textarea
              id="preferences-prompt"
              placeholder="e.g., I prefer Italian and Mexican cuisine, vegetarian meals, beginner-friendly recipes, max 45 minutes cook time, 4 servings, and include some meals that can be reheated for leftovers..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              rows={6}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Describe your dietary preferences, cuisine preferences, skill level, cooking time, servings, and any other requirements.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setPrompt("");
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Weekly Plan
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

