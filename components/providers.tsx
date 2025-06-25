"use client";

import { TooltipProvider } from "@radix-ui/react-tooltip";
import { SessionProvider } from "@/lib/hooks/useSession";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";

// Types for dynamically imported providers
type WagmiProviderType = FC<{ config: any; children: ReactNode }>;
type ConnectKitProviderType = FC<{ children: ReactNode }>;
type ThemeProviderType = FC<{
  children: ReactNode;
  attribute: string;
  defaultTheme: string;
  enableSystem: boolean;
}>;

export function Providers({ children }: { readonly children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [WagmiProvider, setWagmiProvider] = useState<WagmiProviderType | null>(
    null,
  );
  const [ConnectKitProvider, setConnectKitProvider] =
    useState<ConnectKitProviderType | null>(null);
  const [ThemeProvider, setThemeProvider] = useState<ThemeProviderType | null>(
    null,
  );
  const [config, setConfig] = useState<any>(null);
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const setup = async () => {
      try {
        // ✅ Correct dynamic import of named exports
        const { ConnectKitProvider, getDefaultConfig } = await import(
          "connectkit"
        );
        const { createConfig, WagmiProvider } = await import("wagmi");
        const { mainnet, base } = await import("wagmi/chains");
        const { ThemeProvider } = await import("next-themes");

        // ✅ Use getDefaultConfig directly
        const wagmiConfig = createConfig(
          getDefaultConfig({
            appName: "FinnShell",
            chains: [mainnet, base],
            walletConnectProjectId:
              process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
          }),
        );

        // ✅ Set providers with proper typing
        setWagmiProvider(() => WagmiProvider as WagmiProviderType);
        setConnectKitProvider(
          () => ConnectKitProvider as ConnectKitProviderType,
        );
        setThemeProvider(() => ThemeProvider as ThemeProviderType);
        setConfig(wagmiConfig);
        setMounted(true);
      } catch (error) {
        console.error("🔻 Failed to initialize providers:", error);
      }
    };

    setup();
  }, []);

  // Prevent rendering until all async providers are loaded
  if (
    !mounted ||
    !WagmiProvider ||
    !ConnectKitProvider ||
    !ThemeProvider ||
    !config
  ) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <WagmiProvider config={config}>
            <ConnectKitProvider>
              <SessionProvider>{children}</SessionProvider>
            </ConnectKitProvider>
          </WagmiProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
