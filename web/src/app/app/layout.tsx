"use client";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  Banknote,
  FileText,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Plus,
  ScrollText,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/app", icon: LayoutDashboard },
  { label: "Contracts", href: "/app/agreements", icon: ScrollText },
  { label: "Suppliers", href: "/app/suppliers", icon: Users },
  { label: "Bills", href: "/app/obligations", icon: FileText },
  { label: "Account", href: "/app/account", icon: Wallet },
  { label: "Grow", href: "/app/grow", icon: PiggyBank },
  { label: "Pay", href: "/app/payments", icon: Banknote },
  { label: "More", href: "/app/settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { email, loading, signOut } = useAuth();
  const pathname = usePathname();

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 antialiased">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-6">
          <Link href="/app">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/app/new">
              <Button size="sm" className="gap-1.5">
                <Plus className="size-3.5" /> Add bill
              </Button>
            </Link>
            <span className="hidden text-sm text-gray-500 sm:block">
              {email}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={signOut}
              title="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 pb-3 lg:px-6">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950",
                  active &&
                    "bg-slate-950 text-white hover:bg-slate-950 hover:text-white",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-6">{children}</main>
    </div>
  );
}
