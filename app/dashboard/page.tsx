import Link from "next/link";
import { ChefHat, ArrowRight, Calendar } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your recipe management dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/recipes">
          <div className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-center justify-between mb-4">
              <ChefHat className="h-8 w-8 text-primary" />
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">View Recipes</h2>
            <p className="text-muted-foreground">
              Browse and manage all your recipes
            </p>
          </div>
        </Link>

        <Link href="/dashboard/recipes/new">
          <div className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-center justify-between mb-4">
              <ChefHat className="h-8 w-8 text-primary" />
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Create Recipe</h2>
            <p className="text-muted-foreground">
              Add a new recipe to your collection
            </p>
          </div>
        </Link>

        <Link href="/dashboard/weekly-plan">
          <div className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-primary" />
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Weekly Plan</h2>
            <p className="text-muted-foreground">
              Plan your meals for the week
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

