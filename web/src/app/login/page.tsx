"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send code");
      sessionStorage.setItem("pp_pending_email", email.trim());
      router.push("/verify");
    } catch {
      setError("Could not send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to ProofProcure</h1>
        <p className="mt-2 text-sm text-gray-500">Enter your email and we&apos;ll send you a code.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="h-11"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Continue with email"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          No password needed. We&apos;ll send a one-time code to your inbox.
        </p>
      </div>
    </div>
  );
}
