"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type {
  StartAuthenticationOpts,
  StartRegistrationOpts,
} from "@simplewebauthn/browser";
import { ArrowRight, Fingerprint, KeyRound, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

type RegistrationOptionsJSON = StartRegistrationOpts["optionsJSON"];
type AuthenticationOptionsJSON = StartAuthenticationOpts["optionsJSON"];
type PasskeyAction = "register" | "login";

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!response.ok) throw new Error(data.error || "Something went wrong");
  return data as T;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState<PasskeyAction | null>(
    null,
  );
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
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error || "Could not send code.");
      setLoading(false);
      return;
    }

    router.push(`/verify?${new URLSearchParams({ email }).toString()}`);
  }

  async function handlePasskey(action: PasskeyAction) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) return;

    setPasskeyLoading(action);
    setError("");

    try {
      if (action === "register") {
        const options = await postJSON<RegistrationOptionsJSON>(
          "/api/auth/passkey/register/options",
          { email: normalizedEmail },
        );
        const response = await startRegistration({ optionsJSON: options });
        await postJSON("/api/auth/passkey/register/verify", {
          email: normalizedEmail,
          response,
        });
        window.location.assign("/app/onboarding");
        return;
      }

      const options = await postJSON<AuthenticationOptionsJSON>(
        "/api/auth/passkey/login/options",
        { email: normalizedEmail },
      );
      const response = await startAuthentication({ optionsJSON: options });
      await postJSON("/api/auth/passkey/login/verify", {
        email: normalizedEmail,
        response,
      });
      window.location.assign("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey sign-in failed.");
      setPasskeyLoading(null);
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
          <Mail className="size-7" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-slate-500">
          Enter your email. Use a passkey or get a code.
        </p>

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

        {error && (
          <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>
        )}

        <Button
          type="submit"
          className="mt-5 h-12 w-full gap-2"
          disabled={loading || !!passkeyLoading || !email}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          Send code
        </Button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Passkey
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-12 gap-2"
            disabled={loading || !!passkeyLoading || !email}
            onClick={() => handlePasskey("login")}
          >
            {passkeyLoading === "login" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            Use passkey
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 gap-2"
            disabled={loading || !!passkeyLoading || !email}
            onClick={() => handlePasskey("register")}
          >
            {passkeyLoading === "register" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Fingerprint className="size-4" />
            )}
            Create passkey
          </Button>
        </div>
      </form>
    </main>
  );
}
