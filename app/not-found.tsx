import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center my-auto px-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-6xl font-bold tracking-tight text-foreground mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/recipes">Browse Recipes</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
