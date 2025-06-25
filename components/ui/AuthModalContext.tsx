"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type AuthMode = "login" | "signup";
export interface AuthModalContextValue {
  open: boolean;
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  showModal: (mode: AuthMode) => void;
  closeModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(
  undefined,
);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const showModal = (m: AuthMode) => {
    setMode(m);
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  return (
    <AuthModalContext.Provider
      value={{ open, mode, setMode, showModal, closeModal }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx)
    throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
