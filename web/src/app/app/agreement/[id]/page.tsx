"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Loader2,
  LockKeyhole,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Agreement {
  id: string;
  item: string;
  supplier_email: string;
  quantity: string;
  price: string;
  total: string;
  currency: string;
  delivery_window: string;
  payment_condition: string;
  status: string;
  confidence: number | null;
  created_at: string;
  share_token: string | null;
  buyer_ratified_at: string | null;
  supplier_ratified_at: string | null;
}

interface AuditEvent {
  id: number;
  event_type: string;
  actor_email: string | null;
  detail: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  awaiting_supplier: "Sent to supplier",
  awaiting_buyer: "Changes requested",
  ratified: "Locked",
  funded: "Funded",
  delivered: "Delivered",
  payment_released: "Paid",
  rejected: "Rejected",
  expired: "Expired",
  timed_out: "Timed out",
};

const EVENT_LABEL: Record<string, string> = {
  draft_created: "Draft created",
  terms_revised: "Terms edited",
  status_awaiting_supplier: "Sent to supplier",
  supplier_code_sent: "Code sent to supplier",
  supplier_changes_requested: "Supplier asked for changes",
  supplier_confirmed: "Supplier confirmed",
  status_ratified: "Agreement locked",
};

const FIELD_LABELS: Record<keyof DraftFields, string> = {
  supplier_email: "Supplier email",
  item: "What are you buying?",
  quantity: "Quantity",
  price: "Unit price",
  total: "Total amount",
  currency: "Currency",
  delivery_window: "Delivery date or window",
  payment_condition: "When should payment release?",
};

type DraftFields = Pick<
  Agreement,
  | "supplier_email"
  | "item"
  | "quantity"
  | "price"
  | "total"
  | "currency"
  | "delivery_window"
  | "payment_condition"
>;

const EDITABLE = new Set(["draft", "awaiting_buyer"]);

function toDraft(agreement: Agreement): DraftFields {
  return {
    supplier_email: agreement.supplier_email || "",
    item: agreement.item || "",
    quantity: agreement.quantity || "",
    price: agreement.price || "",
    total: agreement.total || "",
    currency: agreement.currency || "USDC",
    delivery_window: agreement.delivery_window || "",
    payment_condition: agreement.payment_condition || "on_delivery",
  };
}

function confidenceLabel(value: number | null) {
  if (!value) return "Needs review";
  if (value >= 0.75) return "Looks good";
  if (value >= 0.5) return "Check details";
  return "Needs review";
}

export default function AgreementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [draft, setDraft] = useState<DraftFields | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/agreements/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const d = data as { agreement?: Agreement; events?: AuditEvent[] };
        setAgreement(d.agreement ?? null);
        setDraft(d.agreement ? toDraft(d.agreement) : null);
        setEvents(d.events ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const missingFields = useMemo(() => {
    if (!draft) return [];
    const missing: (keyof DraftFields)[] = [];
    if (!draft.supplier_email.trim()) missing.push("supplier_email");
    if (!draft.item.trim()) missing.push("item");
    if (!Number(draft.total)) missing.push("total");
    if (!draft.currency.trim()) missing.push("currency");
    if (!draft.delivery_window.trim()) missing.push("delivery_window");
    if (!draft.payment_condition.trim()) missing.push("payment_condition");
    return missing;
  }, [draft]);

  const shareUrl =
    typeof window !== "undefined" && agreement?.share_token
      ? `${window.location.origin}/agreement/${agreement.share_token}`
      : "";

  function updateField(key: keyof DraftFields, value: string) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function saveTerms() {
    if (!draft || !agreement) return;
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/agreements/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Could not save terms.");
      setSaving(false);
      return;
    }
    setAgreement({
      ...agreement,
      ...draft,
      status: agreement.status === "awaiting_buyer" ? "draft" : agreement.status,
      buyer_ratified_at: null,
      supplier_ratified_at: null,
    });
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        event_type: "terms_revised",
        actor_email: null,
        detail: "Agreement terms updated by buyer",
        created_at: new Date().toISOString(),
      },
    ]);
    setMessage("Saved. Send it to the supplier when ready.");
    setSaving(false);
  }

  async function sendToSupplier() {
    if (!agreement || missingFields.length) return;
    setSending(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/agreements/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "send_to_supplier" }),
    });
    const data = (await res.json()) as {
      error?: string;
      share_token?: string;
      share_url?: string;
    };
    if (!res.ok) {
      setError(data.error || "Could not send to supplier.");
      setSending(false);
      return;
    }
    setAgreement({
      ...agreement,
      status: "awaiting_supplier",
      share_token: data.share_token || agreement.share_token,
      buyer_ratified_at: new Date().toISOString(),
      supplier_ratified_at: null,
    });
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        event_type: "status_awaiting_supplier",
        actor_email: null,
        detail: data.share_url || "Sent to supplier",
        created_at: new Date().toISOString(),
      },
    ]);
    setMessage("Sent. Supplier can confirm or ask for changes.");
    setSending(false);
  }

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setMessage("Link copied.");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!agreement || !draft) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Agreement not found.</p>
        <Link
          href="/app/agreements"
          className="mt-4 inline-block text-sm underline"
        >
          Back to contracts
        </Link>
      </div>
    );
  }

  const editable = EDITABLE.has(agreement.status);
  const locked = agreement.status === "ratified";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/app/agreements"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="size-3.5" /> Contracts
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {agreement.item || "Review terms"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Check the terms before supplier sees them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
              {STATUS_LABEL[agreement.status] ?? agreement.status}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
              {confidenceLabel(agreement.confidence)}
            </span>
          </div>
        </div>
      </div>

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

      {locked && (
        <div className="flex items-start gap-3 rounded-3xl bg-slate-950 p-5 text-white">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <p className="font-semibold">Agreement locked</p>
            <p className="mt-1 text-sm text-slate-300">
              Both sides confirmed the same terms. Deployment comes next.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Payment terms</h2>
              {!editable && !locked && (
                <p className="text-sm font-medium text-slate-400">
                  Waiting on supplier
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(FIELD_LABELS) as (keyof DraftFields)[]).map(
                (key) => {
                  const missing = missingFields.includes(key);
                  return (
                    <label key={key} className="grid gap-1.5">
                      <span className="text-sm font-semibold text-slate-600">
                        {FIELD_LABELS[key]}
                      </span>
                      <Input
                        value={draft[key]}
                        onChange={(event) => updateField(key, event.target.value)}
                        disabled={!editable}
                        className={missing ? "border-amber-300 bg-amber-50" : ""}
                      />
                      {missing && (
                        <span className="text-xs font-medium text-amber-700">
                          Needed before sending
                        </span>
                      )}
                    </label>
                  );
                },
              )}
            </div>

            {editable && (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={saveTerms}
                >
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Save terms
                </Button>
                <Button
                  type="button"
                  disabled={sending || missingFields.length > 0}
                  onClick={sendToSupplier}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {sending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Send to supplier
                </Button>
              </div>
            )}
          </div>

          {shareUrl && (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">
                Supplier link
              </p>
              <div className="mt-3 flex items-center gap-3">
                <code className="min-w-0 flex-1 break-all rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {shareUrl}
                </code>
                <Button type="button" variant="outline" onClick={copyShareLink}>
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold">Activity</h2>
          </div>
          <div className="px-5 py-4">
            {events.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              <ol className="relative ml-2 space-y-5 border-l border-slate-200">
                {events.map((ev) => (
                  <li key={ev.id} className="ml-4">
                    <span className="absolute -left-[7px] flex size-3.5 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <CheckCircle2 className="size-2 text-slate-400" />
                    </span>
                    <p className="text-sm font-medium">
                      {EVENT_LABEL[ev.event_type] ?? ev.event_type}
                    </p>
                    <p className="text-xs text-slate-400">
                      {ev.actor_email ?? "system"} ·{" "}
                      {new Date(ev.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {ev.detail && (
                      <p className="mt-0.5 break-words text-xs text-slate-400">
                        {ev.detail}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
