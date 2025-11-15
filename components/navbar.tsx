"use client";

import Link from "next/link";
import { UserButton, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { LogIn, ChefHat, Calendar, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Navbar() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        {/* Left side: Logo and Navigation */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            <ChefHat className="h-5 w-5 mr-2" />
            leChef
          </Link>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          {isLoaded && isSignedIn && (
            <NavigationMenu viewport={false}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="hidden sm:flex">
                    Dashboard
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-1 p-2">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/dashboard/recipes"
                            className="flex justify-start gap-2"
                          >
                            My Recipes
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/dashboard/weekly-plan"
                            className="flex justify-start  gap-2"
                          >
                            My Weekly Plans
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
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
