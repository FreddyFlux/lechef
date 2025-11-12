import Image from "next/image";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-background sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {user
              ? `Welcome back, ${user.firstName || user.emailAddresses[0]?.emailAddress || "User"}!`
              : "Welcome to leChef"}
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {user
              ? "Start creating and managing your recipes."
              : "Sign in to start creating and managing your recipes."}
          </p>
        </div>
      </main>
    </div>
  );
}
