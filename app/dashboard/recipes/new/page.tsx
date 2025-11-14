"use client";

import { RecipeForm } from "@/components/recipe-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewRecipePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/recipes">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Recipe</h1>
        <p className="text-muted-foreground mt-2">
          Add a new recipe to your collection
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <RecipeForm onSuccess={() => window.location.href = "/dashboard/recipes"} />
      </div>
    </div>
  );
}

