"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthCtx {
  email: string | null;
  signIn: (email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthCtx>({ email: null, signIn: () => {}, signOut: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setEmail(typeof window !== "undefined" ? sessionStorage.getItem("pp_email") : null);
  }, []);

  const signIn = (e: string) => {
    sessionStorage.setItem("pp_email", e);
    setEmail(e);
  };

  const signOut = () => {
    sessionStorage.removeItem("pp_email");
    setEmail(null);
    window.location.href = "/";
  };

  return <AuthContext.Provider value={{ email, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
