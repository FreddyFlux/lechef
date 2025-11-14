"use client";

import Link from "next/link";
import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { LogIn, BookOpenText } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        {/* Left side: Logo and Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            <BookOpenText className="h-5 w-5 mr-2" />
            leChef
          </Link>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <Link
            href="/recipes"
            className="hidden sm:flex items-center text-sm font-medium hover:text-foreground/80 transition-colors text-foreground/60"
          >
            Recipes
          </Link>
        </div>

        {/* Right side: Theme Toggle and Clerk */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          {isLoaded && (
            <>
              {isSignedIn ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden sm:flex"
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm" className="hidden sm:flex">
                      Sign Up
                    </Button>
                  </SignUpButton>
                  {/* Mobile: Show Sign In button */}
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="icon" className="sm:hidden">
                      <LogIn className="h-5 w-5" />
                    </Button>
                  </SignInButton>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
