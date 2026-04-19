"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function VerifyPage() {
  const [code, setCode] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { signIn } = useAuth();

  useEffect(() => {
    const pending = sessionStorage.getItem("pp_pending_email");
    if (!pending) {
      router.replace("/login");
      return;
    }
    setEmail(pending);
    refs.current[0]?.focus();
  }, [router]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      refs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      });
      if (!res.ok) {
        const data = ((await res.json()) as any).catch(() => ({}));
        throw new Error(data.error || "Invalid code");
      }
      sessionStorage.removeItem("pp_pending_email");
      signIn(email);
      router.replace("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setCode(Array(6).fill(""));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/login" className="mb-8 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-sm text-gray-500">
          We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-10 rounded-lg border border-gray-200 bg-white text-center text-lg font-semibold outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
              />
            ))}
          </div>
          {error && <p className="mt-3 text-center text-sm text-red-500">{error}</p>}
          <Button type="submit" className="mt-6 w-full h-11" disabled={loading || code.join("").length !== 6}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Verify code"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Didn&apos;t receive it? Check your spam folder or go back to resend.
        </p>
      </div>
    </div>
  );
}
