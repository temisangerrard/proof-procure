"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}

function VerifyForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState(params.get("code") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !code) return;

    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error || "Could not verify code.");
      setLoading(false);
      return;
    }

    router.push("/app/onboarding");
  }

  async function resend() {
    if (!email || resendCooldown > 0) return;
    setResendMessage("");
    const response = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (response.ok) {
      setResendMessage("Code sent again");
      setResendCooldown(30);
    } else {
      setResendMessage("Could not resend. Try again.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <Logo />
        <div className="mt-8 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <KeyRound className="size-7" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Enter code
        </h1>
        <p className="mt-2 text-slate-500">Use the code sent to your email.</p>

        <label className="mt-7 grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <Input
            className="h-14 rounded-2xl px-4 text-lg"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="mt-4 grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Code</span>
          <Input
            className="h-14 rounded-2xl px-4 text-center text-2xl font-semibold tracking-[0.4em]"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </label>

        {error && (
          <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>
        )}

        <Button
          type="submit"
          className="mt-5 h-12 w-full gap-2"
          disabled={loading || !email || !code}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          Continue
        </Button>

        <div className="mt-4 flex items-center justify-between gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>

          <button
            type="button"
            onClick={resend}
            disabled={resendCooldown > 0 || !email}
            className="text-sm text-slate-500 hover:text-slate-950 disabled:opacity-50"
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Didn't get it? Resend code"}
          </button>
        </div>

        {resendMessage && (
          <p className="mt-2 text-center text-sm font-semibold text-emerald-600">
            {resendMessage}
          </p>
        )}
      </form>
    </main>
  );
}
