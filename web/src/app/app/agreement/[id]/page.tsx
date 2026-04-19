"use client";

import { use } from "react";
import { SEED_AGREEMENTS, getAuditTimeline } from "@/lib/seed";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  DollarSign,
  Package,
  ThumbsUp,
  Circle,
} from "lucide-react";

const ACTION_MAP: Record<string, { label: string; icon: typeof Send; variant?: "default" | "outline" }[]> = {
  DRAFT: [
    { label: "Confirm terms", icon: CheckCircle2 },
    { label: "Send to supplier", icon: Send, variant: "outline" },
  ],
  PROPOSED: [{ label: "Send to supplier", icon: Send }],
  RATIFIED: [{ label: "Fund agreement", icon: DollarSign }],
  DEPLOYED: [{ label: "Fund agreement", icon: DollarSign }],
  FUNDED: [{ label: "Mark delivered", icon: Package }],
  DELIVERED_PENDING_CONFIRMATION: [{ label: "Confirm delivery", icon: ThumbsUp }],
  COMPLETED: [],
  EXPIRED: [],
};

const EVENT_ICONS: Record<string, typeof Circle> = {
  CONVERSATION_RECEIVED: Circle,
  TERMS_EXTRACTED: Circle,
  BUYER_CONFIRMED: CheckCircle2,
  SUPPLIER_RATIFIED: CheckCircle2,
  AGREEMENT_FUNDED: DollarSign,
  DELIVERY_MARKED: Package,
  PAYMENT_RELEASED: CheckCircle2,
};

export default function AgreementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agreement = SEED_AGREEMENTS.find((a) => a.id === id);

  if (!agreement) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Agreement not found.</p>
        <Link href="/app" className="mt-4 inline-block text-sm text-gray-900 underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const timeline = getAuditTimeline(agreement);
  const actions = ACTION_MAP[agreement.state] || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/app" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
          <ArrowLeft className="size-3.5" /> Agreements
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{agreement.item}</h1>
            <p className="mt-1 text-sm text-gray-500">
              with {agreement.counterparty} · created{" "}
              {new Date(agreement.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <StatusBadge status={agreement.state} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Terms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="text-sm font-semibold">Agreement terms</h2>
            </div>
            <div className="grid gap-px bg-gray-100 sm:grid-cols-2">
              {[
                { label: "Counterparty", value: `${agreement.counterparty} (${agreement.counterparty_role})` },
                { label: "Item", value: agreement.item },
                { label: "SKU", value: agreement.sku || "—" },
                { label: "Quantity", value: agreement.quantity.toLocaleString() },
                { label: "Unit price", value: `$${agreement.price}` },
                { label: "Total", value: `$${agreement.total.toLocaleString()} ${agreement.currency}` },
                { label: "Delivery window", value: `${fmtDate(agreement.delivery_window.start)} – ${fmtDate(agreement.delivery_window.end)}` },
                { label: "Payment rule", value: agreement.payment_rule },
              ].map((row) => (
                <div key={row.label} className="bg-white px-5 py-3">
                  <p className="text-xs text-gray-400">{row.label}</p>
                  <p className="mt-0.5 text-sm font-medium">{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <Button key={action.label} variant={action.variant || "default"} className="gap-1.5">
                  <action.icon className="size-4" /> {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold">Activity</h2>
          </div>
          <div className="px-5 py-4">
            <ol className="relative border-l border-gray-200 ml-2 space-y-6">
              {timeline.map((ev) => {
                const Icon = EVENT_ICONS[ev.event_type] || Circle;
                return (
                  <li key={ev.id} className="ml-4">
                    <span className="absolute -left-[7px] flex size-3.5 items-center justify-center rounded-full bg-white border border-gray-200">
                      <Icon className="size-2 text-gray-400" />
                    </span>
                    <p className="text-sm font-medium">{ev.label}</p>
                    <p className="text-xs text-gray-400">
                      {ev.actor} · {new Date(ev.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
