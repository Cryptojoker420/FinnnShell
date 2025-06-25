"use client";

import { useAccount } from "wagmi";

type WalletState = {
  isConnected: boolean;
  address?: string;
};

export function useWallet(): WalletState {
  const { isConnected, address } = useAccount();

  return {
    isConnected,
    address,
  };
}
