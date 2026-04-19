"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthCtx {
  email: string | null;
  role: string | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthCtx>({ email: null, role: null, loading: true, signOut: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data?.email) {
          setEmail(data.email);
          setRole(data.role);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const signOut = () => {
    window.location.href = "/cdn-cgi/access/logout";
  };

  return (
    <AuthContext.Provider value={{ email, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
