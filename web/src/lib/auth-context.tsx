"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthCtx {
  email: string | null;
  role: string | null;
  loading: boolean;
  signOut: () => void;
}

interface MeResponse {
  email?: string;
  role?: string;
}

const AuthContext = createContext<AuthCtx>({
  email: null,
  role: null,
  loading: true,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MeResponse | null) => {
        if (data?.email) {
          setEmail(data.email);
          setRole(data.role);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const signOut = () => {
    fetch("/api/auth/sign-out", { method: "POST" }).finally(() => {
      window.location.href = "/login";
    });
  };

  return (
    <AuthContext.Provider value={{ email, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
