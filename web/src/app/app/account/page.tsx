"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, RefreshCw, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function AccountPage() {
  const { email } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState("pending");
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    fetch("/api/auth/wallet")
      .then((r) => r.json())
      .then((d: { address?: string; status?: string }) => {
        if (d.address) setAddress(d.address);
        if (d.status) setWalletStatus(d.status);
      })
      .catch(() => {});
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 10)}...${address.slice(-4)}`
    : "Finish setup";

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add money before paying suppliers.
        </p>
      </div>

      <div className="rounded-3xl bg-slate-950 p-6 text-white">
        <p className="font-semibold text-white">{email || "Your Account"}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
          Payment account
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFull((v) => !v)}
            className="flex-1 truncate rounded-xl bg-white/10 px-4 py-3 text-left font-mono text-sm text-slate-200 hover:bg-white/15 transition-colors"
            title="Click to toggle full address"
          >
            {showFull ? (address ?? "No address yet") : shortAddress}
          </button>
          <button
            type="button"
            onClick={copyAddress}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-200 transition-colors hover:bg-white/20"
          >
            {copied ? (
              <Check className="size-4 text-emerald-400" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex size-24 w-32 items-center justify-center rounded-2xl bg-white aspect-square">
            <span className="text-sm font-semibold text-slate-600">QR</span>
          </div>
          <div>
            <p className="font-semibold text-white">Receive USDC</p>
            <p className="mt-1 text-sm text-slate-400">
              {walletStatus === "ready"
                ? "Copy this to add money."
                : "Your payment account is being prepared."}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Fund your account</h2>
        <div className="mt-3 grid gap-3">
          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Wallet className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Send USDC</p>
              <p className="text-sm text-slate-500">
                Copy your account details and send stable dollars.
              </p>
            </div>
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Copy
            </button>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 opacity-50">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <ArrowRight className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Bank transfer</p>
              <p className="text-sm text-slate-500">
                Coming soon: send from your local bank.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              Soon
            </span>
          </div>

          <Link
            href="/app/reserves"
            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <RefreshCw className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Swap</p>
              <p className="text-sm text-slate-500">
                Move money from another network.
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-slate-300" />
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Supported networks</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
            <span className="size-2.5 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold">Base</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold">ARC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
