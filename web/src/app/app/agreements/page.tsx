"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Loader2, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Agreement {
  id: string;
  item: string;
  supplier_email: string;
  total: string;
  currency: string;
  status: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  awaiting_supplier: "bg-amber-50 text-amber-700",
  awaiting_buyer: "bg-amber-50 text-amber-700",
  ratified: "bg-blue-50 text-blue-700",
  funded: "bg-emerald-50 text-emerald-700",
  delivered: "bg-emerald-50 text-emerald-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  payment_released: "bg-slate-100 text-slate-500",
  rejected: "bg-rose-50 text-rose-700",
  expired: "bg-rose-50 text-rose-600",
  timed_out: "bg-slate-100 text-slate-500",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  awaiting_supplier: "Awaiting supplier",
  awaiting_buyer: "Awaiting you",
  ratified: "Ratified",
  funded: "Funded",
  delivered: "Delivered",
  confirmed: "Confirmed",
  payment_released: "Paid",
  rejected: "Rejected",
  expired: "Expired",
  timed_out: "Timed out",
};

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agreements")
      .then((r) => r.json())
      .then((data) => {
        const d = data as { agreements?: Agreement[] };
        setAgreements(d.agreements ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function create() {
    if (!input.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ raw_input: input }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (data.id) {
        window.location.href = `/app/agreement/${data.id}`;
      } else {
        setError(data.error ?? "Could not create agreement.");
        setCreating(false);
      }
    } catch {
      setError("Could not create agreement.");
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Supplier terms
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste a chat or invoice. Check the terms before you send.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-2">
          <ScanText className="size-5 text-emerald-600" />
          <p className="font-semibold">Capture supplier terms</p>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          We pull out the supplier, amount, date, and payment terms for review.
        </p>
        <textarea
          className="mt-4 h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          placeholder="e.g. Buying 500kg of shea butter from Kwame Asante at $12.40/kg, delivery by March 15, release payment on confirmed delivery."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) create();
          }}
        />
        {error && (
          <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400">⌘ Enter to submit</p>
          <Button
            type="button"
            onClick={create}
            disabled={!input.trim() || creating}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ScanText className="size-4" />
            )}
            {creating ? "Reading terms..." : "Review terms"}
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Your contracts
        </h2>

        {loading ? (
          <div className="mt-4 flex justify-center py-12">
            <Loader2 className="size-5 animate-spin text-slate-300" />
          </div>
        ) : agreements.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText className="size-7" />
            </div>
            <p className="mt-4 font-semibold text-slate-700">
              No contracts yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Paste your first supplier chat or invoice above.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            {agreements.map((a) => (
              <Link
                key={a.id}
                href={`/app/agreement/${a.id}`}
                className="grid gap-2 border-b border-slate-100 px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-semibold">{a.item || "Untitled"}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {a.supplier_email || "No supplier yet"} ·{" "}
                    {new Date(a.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[a.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-700">
                    ${Number(a.total).toLocaleString()} {a.currency}
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
