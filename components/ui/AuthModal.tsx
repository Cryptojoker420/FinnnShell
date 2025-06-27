"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConnectKitButton } from "@/components/ui/ConnectKitButtonDynamic";

import { useWallet } from "@/components/ui/useWallet";
import { useIdentity } from "@/lib/hooks/useIdentity";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { startTwitterLogin } from "@/lib/startTwitterLogin";
import { useAuthModal } from "@/components/ui/AuthModalContext";
import { useSession } from "@/lib/hooks/useSession";
import { getUserFinnKey } from "@/lib/chat/actions";
import { waitForUser } from "@/lib/utils/sessions"; // ✅ FIXED

export default function AuthModal() {
  const supabase = createClientComponentClient();
  const { open, mode, closeModal } = useAuthModal();
  const { identity } = useIdentity();
  const { isConnected, address } = useWallet();
  const [step, setStep] = useState<"auth" | "key">("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [finnKeyInput, setFinnKeyInput] = useState("");
  const { session, loading } = useSession();

  useEffect(() => {
    const checkFinnKey = async () => {
      if (session?.user && step === "auth") {
        try {
          await waitForUser(); // Wait for stable session
          const finnKey = await getUserFinnKey();
          if (!finnKey) {
            setStep("key");
          } else {
            closeModal();
          }
        } catch (error) {
          console.error("Error checking Finn key:", error);
          setStep("auth"); // Reset to auth step if there's an error
        }
      } else if (!session?.user) {
        setStep("auth");
      }
    };

    if (!loading) {
      checkFinnKey();
    }
  }, [session, loading, step, closeModal]);

  if (!open) return null;

  const handleEmailAuth = async () => {
    try {
      if (!identity) {
        toast.error("Identity not ready. Please wait and try again.");
        return;
      }

      const res = await fetch(`/api/auth/${mode}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, identity }),
      });

      const data = await res.json().catch(() => ({
        success: false,
        error: "Server response malformed",
      }));

      if (!data.success) throw new Error(data.error);

      if (mode === "signup") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      await waitForUser(); // ✅ session safe
      const finnKey = await getUserFinnKey();
      if (!finnKey) setStep("key");
      else closeModal();
    } catch (err: any) {
      console.error("[handleEmailAuth] Error:", err);
      toast.error(err.message || "Authentication failed");
    }
  };

  const handleTwitterAuth = async () => {
    try {
      const { data, error } = await startTwitterLogin();
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Twitter login failed");
    }
  };

  const handleWalletAuth = async () => {
    try {
      if (!identity || !address) {
        toast.error("Wallet or identity not available.");
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

      const data = await res.json().catch(() => ({
        success: false,
        error: "Invalid server response",
      }));

      if (!data.success) throw new Error(data.error);
    } catch (err: any) {
      toast.error(err.message || "Wallet login failed");
    }
  };

  const handleKeySubmit = async () => {
    try {
      const user = await waitForUser(); // ✅ use helper
      const res = await fetch("/api/auth/validate-finn-key", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: finnKeyInput }),
      });

      const data = await res.json().catch(() => ({
        success: false,
        error: "Response error",
      }));

      if (!data.success) throw new Error(data.error);

      if (identity) {
        await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(identity),
        });
      }

      toast.success("FINN_KEY saved successfully!");

      await supabase.auth.getSession();
      closeModal();
    } catch (err: any) {
      console.error("[handleKeySubmit] Error:", err);
      toast.error(err.message || "Invalid FINN_KEY");
    }
  };
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={closeModal}
    >
      <div
        className="bg-background p-6 rounded-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "auth" ? (
          <div className="grid gap-4">
            <h2 className="text-lg font-medium text-center">
              {mode === "login" ? "Log in" : "Sign up"}
            </h2>
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              onClick={handleEmailAuth}
              className={buttonVariants({ variant: "default" })}
            >
              {mode === "login" ? "Log in" : "Sign up"}
            </button>
            <div className="flex flex-col items-center gap-2">
              <ConnectKitButton />
              {isConnected && (
                <button
                  onClick={handleWalletAuth}
                  className={buttonVariants({ variant: "default" })}
                >
                  Login with Wallet
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <h2 className="text-lg font-medium text-center">
              Enter your FINN_KEY
            </h2>
            <Input
              type="text"
              value={finnKeyInput}
              onChange={(e) => setFinnKeyInput(e.target.value)}
              placeholder="FINN_KEY"
            />
            <button
              onClick={handleKeySubmit}
              className={buttonVariants({ variant: "default" })}
            >
              Submit Key
            </button>
          </div>
        )}
      </div>
    </div>
  );
}