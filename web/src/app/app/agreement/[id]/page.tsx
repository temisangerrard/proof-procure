"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  DollarSign,
  Loader2,
  Package,
  Send,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  created_at: string;
  share_token: string | null;
}

interface AuditEvent {
  id: number;
  event_type: string;
  actor_email: string | null;
  detail: string | null;
  created_at: string;
}

const STATUS_ACTIONS: Record<
  string,
  { label: string; icon: typeof Send; action: string; variant?: "outline" }[]
> = {
  draft: [
    { label: "Send to supplier", icon: Send, action: "awaiting_supplier" },
  ],
  awaiting_supplier: [],
  ratified: [
    { label: "Fund agreement", icon: DollarSign, action: "funded" },
  ],
  funded: [
    { label: "Mark delivered", icon: Package, action: "delivered" },
  ],
  delivered: [
    { label: "Confirm delivery", icon: ThumbsUp, action: "payment_released" },
    { label: "Reject delivery", icon: Circle, action: "rejected", variant: "outline" },
  ],
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  awaiting_supplier: "Awaiting supplier",
  awaiting_buyer: "Awaiting you",
  ratified: "Ratified",
  funded: "Funded — money locked",
  delivered: "Delivered — pending confirmation",
  confirmed: "Confirmed",
  payment_released: "Paid",
  rejected: "Rejected",
  expired: "Expired",
};

const EVENT_LABEL: Record<string, string> = {
  draft_created: "Agreement drafted",
  status_awaiting_supplier: "Sent to supplier",
  status_ratified: "Ratified",
  status_funded: "Funded",
  status_delivered: "Marked as delivered",
  status_payment_released: "Payment released",
  status_rejected: "Delivery rejected",
};

export default function AgreementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    fetch(`/api/agreements/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const d = data as { agreement?: Agreement; events?: AuditEvent[] };
        setAgreement(d.agreement ?? null);
        setEvents(d.events ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function takeAction(newStatus: string) {
    if (!agreement) return;
    setActioning(true);
    await fetch(`/api/agreements/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setAgreement({ ...agreement, status: newStatus });
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        event_type: `status_${newStatus}`,
        actor_email: null,
        detail: `Status changed to ${newStatus}`,
        created_at: new Date().toISOString(),
      },
    ]);
    setActioning(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500">Agreement not found.</p>
        <Link href="/app/agreements" className="mt-4 inline-block text-sm underline">
          Back to contracts
        </Link>
      </div>
    );
  }

  const actions = STATUS_ACTIONS[agreement.status] ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
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
              {agreement.item || "Untitled agreement"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {agreement.supplier_email || "No supplier"} · created{" "}
              {new Date(agreement.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
            {STATUS_LABEL[agreement.status] ?? agreement.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold">Agreement terms</h2>
            </div>
            <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
              {[
                { label: "Supplier", value: agreement.supplier_email || "—" },
                { label: "Item", value: agreement.item || "—" },
                { label: "Quantity", value: agreement.quantity || "—" },
                { label: "Unit price", value: agreement.price ? `$${agreement.price}` : "—" },
                {
                  label: "Total",
                  value: agreement.total
                    ? `$${Number(agreement.total).toLocaleString()} ${agreement.currency}`
                    : "—",
                },
                { label: "Delivery", value: agreement.delivery_window || "—" },
                { label: "Payment", value: agreement.payment_condition || "—" },
              ].map((row) => (
                <div key={row.label} className="bg-white px-5 py-3">
                  <p className="text-xs text-slate-400">{row.label}</p>
                  <p className="mt-0.5 text-sm font-medium">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {actions.map((a) => (
                <Button
                  key={a.label}
                  variant={a.variant ?? "default"}
                  className="gap-1.5"
                  disabled={actioning}
                  onClick={() => takeAction(a.action)}
                >
                  {actioning ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <a.icon className="size-4" />
                  )}
                  {a.label}
                </Button>
              ))}
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
                      <p className="mt-0.5 text-xs text-slate-400">{ev.detail}</p>
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
