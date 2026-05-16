"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

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
    const data = await response.json() as { error?: string };

    if (!response.ok) {
      setError(data.error || "Could not verify code.");
      setLoading(false);
      return;
    }

    router.push("/app/onboarding");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <Logo />
        <div className="mt-8 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <KeyRound className="size-7" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Enter code</h1>
        <p className="mt-2 text-slate-500">Use the code sent to your email.</p>

        <label className="mt-7 grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <Input className="h-14 rounded-2xl px-4 text-lg" value={email} onChange={(event) => setEmail(event.target.value)} />
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

        {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}

        <Button className="mt-5 h-12 w-full gap-2" disabled={loading || !email || !code}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Continue
        </Button>
      </form>
    </main>
  );
}
