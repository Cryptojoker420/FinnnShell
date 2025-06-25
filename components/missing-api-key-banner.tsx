"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useAuthModal } from "@/components/ui/AuthModalContext";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/hooks/useSession";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function MissingApiKeyBanner(_: { missingKeys?: string[] }) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const { showModal } = useAuthModal();
  const { session, loading } = useSession();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkVerification = async () => {
      if (!session?.user) {
        setIsVerified(false);
        return
      };

      try {
        const { data: userSettings, error } = await supabase
          .from('user_settings')
          .select('finn_key_verified')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.warn("[MissingApiKeyBanner] Couldn't fetch verification status:", error.message);
          setIsVerified(false);
          return;
        }

        setIsVerified(userSettings?.finn_key_verified || false);
      } catch (err) {
        console.error("[MissingApiKeyBanner] Unexpected error checking verification:", err);
        setIsVerified(false);
      }
    };

    checkVerification();
    
  }, [session, supabase]);

  if (loading || isVerified === null || isVerified) return null;

  return (
    <div className="border p-4 bg-orange-50">
      <div className="text-orange-700 font-medium mb-2">
        Please provide your FINN_KEY to use the model.
      </div>
      <Button onClick={() => showModal("login")}>Enter FINN_KEY</Button>
    </div>
  );
}