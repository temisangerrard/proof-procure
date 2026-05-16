"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json() as { error?: string; devCode?: string };

    if (!response.ok) {
      setError(data.error || "Could not send code.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ email });
    if (data.devCode) params.set("code", data.devCode);
    router.push(`/verify?${params.toString()}`);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <Logo />
        <div className="mt-8 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Mail className="size-7" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-slate-500">Enter your email. We will send a code.</p>

        <label className="mt-7 grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <Input
            className="h-14 rounded-2xl px-4 text-lg"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@business.com"
          />
        </label>

        {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}

        <Button className="mt-5 h-12 w-full gap-2" disabled={loading || !email}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Send code
        </Button>
      </form>
    </main>
  );
}
