"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  Loader2,
  PiggyBank,
  RefreshCcw,
  ShieldCheck,
  Sprout,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GrowAllocationRecord } from "@/lib/procure-store";

type GrowState = "idle" | "previewing" | "allocated" | "withdrawal_pending";

function fmtWhole(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatApy(apy: number | null): string {
  if (apy === null) return "Rate unavailable";
  return `~${(apy * 100).toFixed(1)}% per year`;
}

export function GrowPanel({
  initialAllocation,
  safeToGrow,
  reservedForBills,
  bestApy,
}: {
  initialAllocation: GrowAllocationRecord | null;
  safeToGrow: number;
  reservedForBills: number;
  bestApy: number | null;
}) {
  const [state, setState] = useState<GrowState>(
    initialAllocation ? "allocated" : "idle",
  );
  const [allocation, setAllocation] = useState<GrowAllocationRecord | null>(
    initialAllocation,
  );
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const safeCap = state === "allocated" ? 0 : safeToGrow;

  async function handleConfirmAllocation() {
    if (parsedAmount <= 0) {
      setError("Enter an amount to put into Grow.");
      return;
    }
    if (parsedAmount > safeToGrow) {
      setError(
        `You can put up to ${fmtWhole(safeToGrow)} into Grow — your bills need ${fmtWhole(reservedForBills)} reserved.`,
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/grow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount }),
      });
      const data = (await res.json()) as {
        allocation?: GrowAllocationRecord;
        error?: string;
        safeToGrow?: number;
      };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setAllocation(data.allocation!);
      setState("allocated");
      setAmount("");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!allocation) return;
    setState("withdrawal_pending");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/grow/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocationId: allocation.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Withdrawal failed. Try again.");
        setState("allocated");
        return;
      }
      setAllocation(null);
      setState("idle");
    } finally {
      setLoading(false);
    }
  }

  const effectiveSafeToGrow = state === "allocated" ? 0 : safeToGrow;

  return (
    <div className="space-y-4">
      {/* Bucket summary row */}
      <div className="grid gap-3 md:grid-cols-3">
        <Bucket
          label="Safe to put in Grow"
          value={effectiveSafeToGrow > 0 ? fmtWhole(effectiveSafeToGrow) : "—"}
          note={
            state === "allocated"
              ? "Fully allocated"
              : `Bills need ${fmtWhole(reservedForBills)} reserved`
          }
          icon={WalletCards}
        />
        <Bucket
          label="Earning"
          value={allocation ? fmtWhole(allocation.amount) : "—"}
          note={allocation ? "Returns from provider" : "No active position"}
          icon={Sprout}
          active={state === "allocated" || state === "withdrawal_pending"}
        />
        <Bucket
          label="Coming out"
          value={state === "withdrawal_pending" ? fmtWhole(allocation?.amount ?? 0) : "—"}
          note={
            state === "withdrawal_pending"
              ? "Returning to balance..."
              : "Nothing in transit"
          }
          icon={RefreshCcw}
        />
      </div>

      {/* Main action card */}
      {state === "idle" && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              <Sprout className="size-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Allocate to Grow</h2>
              <p className="mt-1 text-sm text-slate-500">
                Earn {formatApy(bestApy)} on money you&apos;re not paying out
                yet. Move it back any time.
              </p>
            </div>
          </div>
          {safeToGrow > 0 ? (
            <div className="mt-5">
              <p className="text-sm text-slate-500">
                You can put up to{" "}
                <span className="font-semibold text-slate-950">
                  {fmtWhole(safeToGrow)}
                </span>{" "}
                into Grow — your bills need{" "}
                <span className="font-semibold text-slate-950">
                  {fmtWhole(reservedForBills)}
                </span>{" "}
                reserved.
              </p>
              <Button
                className="mt-4 h-12 gap-2"
                onClick={() => setState("previewing")}
              >
                <PiggyBank className="size-4" />
                Allocate to Grow
              </Button>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
              All available balance is reserved for bills. Free up some bills to
              use Grow.
            </div>
          )}
        </div>
      )}

      {state === "previewing" && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">How much to put in Grow?</h2>
            <button
              type="button"
              onClick={() => {
                setState("idle");
                setAmount("");
                setError("");
              }}
              className="flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-950"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Safe to allocate:{" "}
            <span className="font-semibold text-slate-950">
              {fmtWhole(safeToGrow)}
            </span>
          </p>

          <div className="mt-5">
            <label className="text-sm font-medium text-slate-700">
              Amount (USD)
            </label>
            <input
              type="number"
              min="1"
              max={safeToGrow}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              placeholder="e.g. 5000"
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold tabular-nums text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-4">
            <InfoRow label="Rate today" value={formatApy(bestApy)} />
            <InfoRow label="Access" value="Move back any time" />
            <InfoRow label="Returns" value="Principal + earned yield on withdrawal" />
          </div>

          {error && (
            <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
          )}

          <div className="mt-5 flex gap-3">
            <Button
              variant="outline"
              className="h-12"
              onClick={() => {
                setState("idle");
                setAmount("");
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-12 flex-1 gap-2"
              onClick={handleConfirmAllocation}
              disabled={loading || parsedAmount <= 0 || parsedAmount > safeCap}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {parsedAmount > 0
                ? `Confirm — Allocate ${fmtWhole(parsedAmount)}`
                : "Enter an amount"}
            </Button>
          </div>
        </div>
      )}

      {(state === "allocated" || state === "withdrawal_pending") &&
        allocation && (
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Sprout className="size-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">
                    {fmtWhole(allocation.amount)} earning
                  </h2>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    Earning
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Started{" "}
                  {new Date(allocation.started_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 rounded-2xl bg-slate-50 p-4">
              <InfoRow label="Amount earning" value={fmtWhole(allocation.amount)} />
              <InfoRow label="Rate" value={formatApy(bestApy)} />
              <InfoRow label="Returns" value="Principal + earned yield on withdrawal" />
              <InfoRow label="Access" value="Move back any time" />
            </div>

            {error && (
              <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
            )}

            <Button
              variant="outline"
              className="mt-5 h-12 w-full gap-2"
              onClick={handleWithdraw}
              disabled={state === "withdrawal_pending" || loading}
            >
              {state === "withdrawal_pending" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Returning your money...
                </>
              ) : (
                <>
                  <ArrowDownLeft className="size-4" />
                  Move back to procurement balance
                </>
              )}
            </Button>
          </div>
        )}

      {/* How Grow works */}
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold">How Grow works</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Step number="1" label="Check your bills are covered" icon={ShieldCheck} />
          <Step number="2" label="Allocate what you don't need yet" icon={PiggyBank} />
          <Step number="3" label="Move back when payment is due" icon={ArrowDownLeft} />
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Grow uses only money that isn&apos;t reserved for upcoming supplier
          payments. Your bills always come first.
        </p>
      </div>
    </div>
  );
}

function Bucket({
  label,
  value,
  note,
  icon: Icon,
  active = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof ShieldCheck;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-5 shadow-sm ring-1 ${active ? "bg-emerald-50 ring-emerald-200" : "bg-white ring-slate-200"}`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex size-11 items-center justify-center rounded-2xl ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          <Icon className="size-5" />
        </div>
        {active && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Active
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function Step({
  number,
  label,
  icon: Icon,
}: {
  number: string;
  label: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
        {number}
      </span>
      <Icon className="size-5 shrink-0 text-slate-500" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
