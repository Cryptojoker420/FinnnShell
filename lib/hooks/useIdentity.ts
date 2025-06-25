import { type IdentityPayload, getIdentityPayload } from "@/lib/identity";
import { useEffect, useState } from "react";

type Identity = IdentityPayload & {
  ip_address: string;
};

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadIdentity = async () => {
      const baseData = await getIdentityPayload();

      const ipInfoToken = process.env.NEXT_PUBLIC_IPINFO_TOKEN;
      let ip = "unknown";

      if (ipInfoToken) {
        try {
          const res = await fetch(
            `https://ipinfo.io/json?token=${ipInfoToken}`,
          );
          const json = await res.json();
          ip = json.ip ?? "unknown";
        } catch {
          ip = "unknown";
        }
      }

      setIdentity({ ...baseData, ip_address: ip });
      setReady(true);
    };

    loadIdentity();
  }, []);

  return { identity, ready };
}
