"use client";

import { ReactNode } from "react";
import { Header } from "@/components/header";
import { AuthModalProvider } from "@/components/ui/AuthModalContext";
import AuthModal from "@/components/ui/AuthModal";
import { TickerTape } from "@/components/tradingview/ticker-tape";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <AuthModalProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <TickerTape />
        <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
        <AuthModal />
      </div>
    </AuthModalProvider>
  );
}
