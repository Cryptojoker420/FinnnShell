"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConnectKitButton } from "@/components/ui/ConnectKitButtonDynamic";
import { AuthError } from "@supabase/supabase-js";
import { useWallet } from "@/components/ui/useWallet";
import { useIdentity } from "@/lib/hooks/useIdentity";
import { startTwitterLogin } from "@/lib/startTwitterLogin";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "@/lib/hooks/useSession";

interface AuthFormProps {
  action: "login" | "signup";
}

export function AuthForm({ action }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { identity, ready } = useIdentity();
  const { isConnected, address } = useWallet();
  const supabase = createClientComponentClient();

  // Correctly destructure session and loading from useSession
  const { session, loading } = useSession();
  const isAuthenticated = !!session?.user;

  const handleEmailAuth = async () => {
    try {
      const res = await fetch(`/api/auth/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, identity }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? "Authentication failed");
        return;
      }

      localStorage.setItem("email", email);
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    }
  };

  const handleTwitterAuth = async () => {
    try {
      const result = await startTwitterLogin();
      const error = (result as any)?.error;

      if (error) {
        toast.error(
          typeof error === "object" && "message" in error
            ? error.message
            : "Twitter login failed",
        );
        return;
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Twitter login failed");
    }
  };

  const handleWalletAuth = async () => {
    try {
      if (!identity || !address) {
        toast.error("Wallet login unavailable");
        return;
      }
      const res = await fetch("/api/auth/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: identity.ussid ?? identity.userId,
          identity,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? "Wallet login failed");
        return;
      }

      localStorage.setItem("wallet", address || "");
    } catch (err: any) {
      toast.error(err.message ?? "Wallet login failed");
    }
  };

  // Show loading state while session is being fetched
  if (loading) return <p>Loading...</p>;

  return (
    <div className="grid gap-6 mx-auto w-full max-w-md pt-10">
      <div className="flex flex-col space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {action === "login" ? "Log in" : "Sign up"}
        </h1>
      </div>

      <div className="grid gap-2">
        <button
          onClick={handleTwitterAuth}
          className={buttonVariants({ variant: "outline" })}
        >
          Continue with Twitter
        </button>

        <div className="flex items-center gap-2">
          <Separator className="w-full" />
          <span className="text-sm text-muted-foreground">or</span>
          <Separator className="w-full" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={
              action === "login" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleEmailAuth}
            className={buttonVariants({ variant: "default" })}
          >
            {action === "login" ? "Log in" : "Sign up"}
          </button>
        </div>

        <p className="px-8 text-sm text-center text-muted-foreground">
          {action === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <Link
            href={action === "login" ? "/signup" : "/login"}
            className={buttonVariants({ variant: "link" })}
          >
            {action === "login" ? "Sign up" : "Log in"}
          </Link>
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <ConnectKitButton />
        {isConnected && !isAuthenticated && (
          <button
            onClick={handleWalletAuth}
            className={buttonVariants({ variant: "default" })}
          >
            Login with Wallet
          </button>
        )}
      </div>
    </div>
  );
}
