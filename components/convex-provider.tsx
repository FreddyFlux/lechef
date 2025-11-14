"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ReactNode, useMemo, useEffect } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
  
  const convex = useMemo(() => {
    return new ConvexReactClient(convexUrl, {
      auth: async () => {
        if (!isLoaded || !isSignedIn) {
          return undefined;
        }
        try {
          const token = await getToken();
          return token || undefined;
        } catch (error) {
          console.error("Error getting Clerk token:", error);
          return undefined;
        }
      },
    });
  }, [convexUrl, getToken, isLoaded, isSignedIn]);

  // Clear auth when signing out
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      convex.clearAuth();
    }
  }, [isLoaded, isSignedIn, convex]);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
