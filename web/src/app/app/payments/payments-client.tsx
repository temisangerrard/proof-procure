"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/procurement-demo";
import type { BillRecord } from "@/lib/procure-store";

export function PaymentsClient({
  initialBills,
}: {
  initialBills: BillRecord[];
}) {
  const [bills, setBills] = useState(initialBills);
  const [selectedId, setSelectedId] = useState(
    initialBills.find((bill) => bill.status !== "paid")?.id || "",
  );
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("Check once before sending.");

  const payable = bills.filter((bill) => bill.status !== "paid");
  const selected = useMemo(
    () =>
      bills.find((bill) => bill.id === selectedId) || payable[0] || bills[0],
    [bills, payable, selectedId],
  );
  const canPay =
    selected && (selected.status === "ready" || selected.status === "short");

  async function paySelected() {
    if (!selected || !canPay) return;
    setPaying(true);
    setMessage("Sending payment...");

    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ billId: selected.id }),
    });

    if (!response.ok) {
      setMessage("Payment could not be sent.");
      setPaying(false);
      return;
    }

    setBills((current) =>
      current.map((bill) =>
        bill.id === selected.id ? { ...bill, status: "sent" } : bill,
      ),
    );
    setMessage("Payment started. Waiting for confirmation.");
    setPaying(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pay</h1>
        <p className="mt-1 text-sm text-slate-500">Send money.</p>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Bills</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {bills.map((bill) => {
              const paid = bill.status === "paid";
              const sent = bill.status === "sent";
              const active = selected?.id === bill.id;

              return (
                <button
                  key={bill.id}
                  onClick={() => setSelectedId(bill.id)}
                  className={`grid w-full gap-4 px-5 py-4 text-left transition-colors md:grid-cols-[1fr_auto] ${active ? "bg-emerald-50" : "hover:bg-slate-50"}`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {bill.supplier_name || "Supplier"}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ${paid ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}
                      >
                        {paid ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <ShieldCheck className="size-3" />
                        )}
                        {paid
                          ? "Paid"
                          : sent
                            ? "Sent"
                            : bill.status === "short"
                              ? "Short"
                              : "Ready"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {bill.title}{" "}
                      {bill.due_date
                        ? `· Due ${formatDate(bill.due_date)}`
                        : ""}
                    </p>
                    <p className="mt-2 text-sm font-semibold tabular-nums">
                      {formatMoney(bill.amount, bill.currency)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold ${paid ? "bg-slate-100 text-slate-500" : "bg-slate-950 text-white"}`}
                  >
                    {paid ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {paid ? "Paid" : sent ? "Sent" : "Pick"}
                  </span>
                </button>
              );
            })}
            {bills.length === 0 && (
              <div className="p-5 text-sm text-slate-500">
                Add a bill first.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20">
            <Banknote className="size-6" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">Check</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>

          <div className="mt-5 space-y-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <ConfirmRow
              label="Person"
              value={selected?.supplier_name || "Supplier"}
            />
            <ConfirmRow
              label="Amount"
              value={
                selected
                  ? formatMoney(selected.amount, selected.currency)
                  : "$0"
              }
            />
            <ConfirmRow label="Bill" value={selected?.title || "None"} />
          </div>

          <div className="mt-5 rounded-xl bg-emerald-400/10 p-4 text-emerald-100 ring-1 ring-emerald-300/20">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4" />
              Final check
            </p>
            <p className="mt-1 text-sm">
              Money leaves only after you press Confirm.
            </p>
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              variant="secondary"
              className="h-10 flex-1 gap-2"
              onClick={paySelected}
              disabled={!selected || !canPay || paying}
            >
              {canPay ? (
                <ShieldCheck className="size-4" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
              {paying ? "Sending" : "Confirm"}
            </Button>
            <Button
              variant="outline"
              className="h-10 flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-white">
        {value}
      </span>
    </div>
  );
}
