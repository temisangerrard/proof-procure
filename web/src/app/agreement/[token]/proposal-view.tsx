"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Mail, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PublicAgreement {
  id: string;
  supplier_email: string;
  item: string;
  quantity: string;
  price: string;
  total: string;
  currency: string;
  delivery_window: string | null;
  payment_condition: string;
  status: string;
  confidence: number | null;
  buyer_ratified_at: string | null;
  supplier_ratified_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Still being prepared",
  awaiting_supplier: "Ready for your review",
  awaiting_buyer: "Changes sent to buyer",
  ratified: "Agreement locked",
};

export function ProposalView({
  agreement,
  token,
}: {
  agreement: PublicAgreement;
  token: string;
}) {
  const [status, setStatus] = useState(agreement.status);
  const [code, setCode] = useState("");
  const [changeRequest, setChangeRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function requestCode() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/agreement-links/${token}/send-code`, {
      method: "POST",
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not send code.");
      setBusy(false);
      return;
    }
    setMessage("Code sent to supplier email.");
    setBusy(false);
  }

  async function confirmTerms() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/agreement-links/${token}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = (await res.json()) as { error?: string; status?: string };
    if (!res.ok) {
      setError(data.error || "Could not confirm.");
      setBusy(false);
      return;
    }
    setStatus(data.status || "ratified");
    setMessage("Confirmed. Buyer can see this now.");
    setBusy(false);
  }

  async function requestChanges() {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/agreement-links/${token}/request-changes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, change_request: changeRequest }),
    });
    const data = (await res.json()) as { error?: string; status?: string };
    if (!res.ok) {
      setError(data.error || "Could not send changes.");
      setBusy(false);
      return;
    }
    setStatus(data.status || "awaiting_buyer");
    setMessage("Changes sent to buyer.");
    setBusy(false);
  }

  const canAct = status === "awaiting_supplier";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-semibold text-emerald-300">
            Proof Procure
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Review payment terms
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Check the order before the buyer locks it.
          </p>
          <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
            {STATUS_LABEL[status] ?? status}
          </span>
        </header>

        {message && (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-100">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          {[
            ["Supplier email", agreement.supplier_email],
            ["Item", agreement.item],
            ["Quantity", agreement.quantity],
            ["Unit price", `${agreement.price} ${agreement.currency}`],
            [
              "Total",
              `${Number(agreement.total).toLocaleString()} ${agreement.currency}`,
            ],
            ["Delivery", agreement.delivery_window || "Not set"],
            ["Payment", agreement.payment_condition],
          ].map(([label, value]) => (
            <div
              key={label}
              className="border-b border-slate-100 px-5 py-4 last:border-b-0"
            >
              <p className="text-xs font-semibold uppercase text-slate-400">
                {label}
              </p>
              <p className="mt-1 font-semibold">{value}</p>
            </div>
          ))}
        </section>

        {status === "ratified" && (
          <section className="flex items-start gap-3 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="font-semibold">Agreement confirmed</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Both sides have confirmed the same payment terms.
              </p>
            </div>
          </section>
        )}

        {canAct && (
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Confirm by email</h2>
                <p className="mt-1 text-sm text-slate-500">
                  We send a code to the supplier email above.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={requestCode}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                Send code
              </Button>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-sm font-semibold text-slate-600">
                Code
              </span>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                placeholder="6 digit code"
              />
            </label>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={confirmTerms}
                disabled={busy || !code.trim()}
              >
                <CheckCircle2 className="size-4" />
                Confirm terms
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={requestChanges}
                disabled={busy || !code.trim() || !changeRequest.trim()}
              >
                <MessageSquareText className="size-4" />
                Ask for changes
              </Button>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-sm font-semibold text-slate-600">
                Changes needed
              </span>
              <textarea
                value={changeRequest}
                onChange={(event) => setChangeRequest(event.target.value)}
                className="min-h-24 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="Example: delivery date should be June 12"
              />
            </label>
          </section>
        )}
      </div>
    </main>
  );
}
