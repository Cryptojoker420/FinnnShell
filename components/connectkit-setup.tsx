"use client";

import type React from "react";
import { type PropsWithChildren, useEffect, useState } from "react";
import type { Config } from "wagmi";

export function Web3Provider({ children }: Readonly<PropsWithChildren>) {
  const [ProviderTree, setProviderTree] = useState<React.ReactNode>(null);

  useEffect(() => {
    async function setup() {
      try {
        const { ConnectKitProvider, getDefaultConfig } = (await import(
          "connectkit"
        )) as {
          ConnectKitProvider: React.ComponentType<{
            children?: React.ReactNode;
          }>;
          getDefaultConfig: typeof import("connectkit").getDefaultConfig;
        };

        const { WagmiConfig, createConfig } = (await import("wagmi")) as {
          WagmiConfig: React.ComponentType<{
            config: Config;
            children?: React.ReactNode;
          }>;
          createConfig: typeof import("wagmi").createConfig;
        };

        const { mainnet, base } = await import("wagmi/chains");

        const config = createConfig(
          getDefaultConfig({
            appName: "FinnShell",
            chains: [mainnet, base],
            walletConnectProjectId:
              process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
          }),
        );

        const tree = (
          <WagmiConfig config={config}>
            <ConnectKitProvider>{children}</ConnectKitProvider>
          </WagmiConfig>
        );

        setProviderTree(tree);
      } catch (error) {
        console.error("❌ Failed to setup Web3Provider:", error);
      }
    }

    setup();
  }, []);

  return <>{ProviderTree}</>;
}
