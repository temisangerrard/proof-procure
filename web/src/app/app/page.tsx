"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageSquareText, Mail, FileUp, ArrowRight } from "lucide-react";

interface DBAgreement {
  id: string;
  item: string;
  status: string;
  supplier_email: string;
  quantity: string;
  price: string;
  total: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  awaiting_buyer: { label: "Awaiting buyer", className: "bg-blue-50 text-blue-700" },
  awaiting_supplier: { label: "Awaiting supplier", className: "bg-blue-50 text-blue-700" },
  ratified: { label: "Ratified", className: "bg-amber-50 text-amber-700" },
  funded: { label: "Funded", className: "bg-indigo-50 text-indigo-700" },
  delivered: { label: "Delivered", className: "bg-orange-50 text-orange-700" },
  confirmed: { label: "Confirmed", className: "bg-emerald-50 text-emerald-700" },
  payment_released: { label: "Payment released", className: "bg-emerald-50 text-emerald-700" },
};

const QUICK_START = [
  { icon: MessageSquareText, title: "Paste conversation", desc: "Copy a Telegram or WhatsApp chat", href: "/app/new" },
  { icon: Mail, title: "Forward email thread", desc: "Forward procurement emails to extract terms", href: "/app/new" },
  { icon: FileUp, title: "Upload document", desc: "Upload a PO, invoice, or spec sheet", href: "/app/new" },
];

export default function AppDashboard() {
  const [agreements, setAgreements] = useState<DBAgreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agreements")
      .then((r) => r.json())
      .then((d: any) => setAgreements(d.agreements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agreements</h1>
        <p className="mt-1 text-sm text-gray-500">
          Paste a chat, forward an email, or upload a document. Terms are extracted, both parties confirm, payment executes.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {QUICK_START.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
          >
            <item.icon className="size-5 text-gray-400 group-hover:text-gray-900 transition" />
            <h3 className="mt-3 text-sm font-medium">{item.title}</h3>
            <p className="mt-1 text-xs text-gray-400">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your agreements</h2>
          <span className="text-sm text-gray-400">{agreements.length} total</span>
        </div>

        {loading ? (
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            Loading…
          </div>
        ) : agreements.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">No agreements yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Paste a conversation or forward an email to create your first agreement.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {agreements.map((agr) => {
              const s = STATUS_LABELS[agr.status] || { label: agr.status, className: "bg-gray-100 text-gray-600" };
              return (
                <Link
                  key={agr.id}
                  href={`/app/agreement/${agr.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="truncate text-sm font-medium">{agr.item}</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {agr.supplier_email || "No supplier"} · {agr.quantity} × ${agr.price} · ${agr.total}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-gray-300" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
