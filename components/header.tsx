"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { IconSeparator } from "@/components/ui/icons";
import { useSession } from "@/lib/hooks/useSession";
import { useAuthModal } from "@/components/ui/AuthModalContext";
import { useIdentity } from "@/lib/hooks/useIdentity";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

function UserOrLogin() {
  const { session, loading } = useSession();
  const { showModal } = useAuthModal();
  const { identity } = useIdentity();

  return (
    <>
      {/* Snailbrook Shell Logo */}
      <Link href="/" className="flex items-center space-x-2">
        {/* Wrap image in a span to avoid typing issue */}
        <span>
          <Image
            src="/shell_logo_500.png"
            alt="Snailbrook Terminal Logo"
            width={35}
            height={35}
            priority
          />
        </span>
      </Link>

      {/* Divider + Actions */}
      <div className="flex items-center font-semibold space-x-3 text-sm ml-4">
        <IconSeparator className="size-5 text-muted-foreground/50" />
        <Link href="/" className="hover:underline text-muted-foreground">
          The Shell
        </Link>
        <IconSeparator className="size-5 text-muted-foreground/50" />
        <button
          onClick={() => {
            // Clear the current chat ID from localStorage
            localStorage.removeItem("chatId");
            localStorage.removeItem("newChatId");
            // Navigate to home page to start fresh
            window.location.href = "/";
          }}
          className="text-[#6C5DD3] hover:text-[#A993FE] transition-colors"
          style={{ padding: "2px 6px" }}
        >
          Start New Transmission
        </button>
      </div>
    </>
  );
}

export function Header() {
  const { session, loading } = useSession();
  const { showModal } = useAuthModal();
  const { identity } = useIdentity();
  const supabase = createClientComponentClient();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </Suspense>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <button
          className="px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-muted"
          onClick={() => document.documentElement.classList.toggle("dark")}
        >
          Toggle theme
        </button>

        {!loading &&
          (session?.user ? (
            <button
              onClick={async () => {
                try {
                  // First, sign out from Supabase client
                  const { error: signOutError } = await supabase.auth.signOut();
                  if (signOutError) throw signOutError;

                  // Then call the server logout endpoint
                  const res = await fetch("/api/auth/logout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: session.user.id, identity }),
                  });
                  
                  if (!res.ok) {
                    const errorData = await res
                      .json()
                      .catch(() => ({ message: res.statusText }));
                    throw new Error(errorData.message || "Logout failed");
                  }

                  // Clear any local storage items
                  localStorage.clear();
                  
                  toast.success("Logged out successfully!");
                  
                  // Force a hard reload to clear all state
                  window.location.href = "/";
                } catch (err: any) {
                  console.error("❌ Logout error:", err);
                  toast.error(err.message || "Logout failed");
                }
              }}
              className={buttonVariants({ variant: "ghost" })}
            >
              Log out
            </button>
          ) : (
            <>
              <button
                onClick={() => showModal("login")}
                className={buttonVariants({ variant: "ghost" })}
              >
                Log in
              </button>
              <button
                onClick={() => showModal("signup")}
                className={buttonVariants({ variant: "default" })}
              >
                Sign up
              </button>
            </>
          ))}
      </div>
    </header>
  );
}
