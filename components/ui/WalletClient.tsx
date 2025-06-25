"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

type Props = {
  onReady: (wallet: { isConnected: boolean; address?: string }) => void;
};

export default function WalletClient({ onReady }: Props) {
  const { isConnected, address } = useAccount();

  useEffect(() => {
    onReady({ isConnected, address });
  }, [isConnected, address, onReady]);

  return null;
}
