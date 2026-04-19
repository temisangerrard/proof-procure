"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { email, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!email && typeof window !== "undefined" && !sessionStorage.getItem("pp_email")) {
      router.replace("/login");
    }
  }, [email, router]);

  if (!email) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/app" className="text-lg font-semibold tracking-tight">
            ProofProcure
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/app/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="size-3.5" /> New agreement
              </Button>
            </Link>
            <span className="hidden text-sm text-gray-500 sm:block">{email}</span>
            <Button variant="ghost" size="icon-sm" onClick={signOut} title="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
