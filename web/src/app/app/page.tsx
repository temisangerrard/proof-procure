"use client";

import Link from "next/link";
import { SEED_AGREEMENTS } from "@/lib/seed";
import { StatusBadge } from "@/components/status-badge";
import { MessageSquareText, Mail, FileUp, Bot, ArrowRight } from "lucide-react";

const QUICK_START = [
  { icon: MessageSquareText, title: "Paste a conversation", desc: "Copy a Telegram or WhatsApp chat", href: "/app/new" },
  { icon: Mail, title: "Forward an email thread", desc: "Forward procurement emails to extract terms", href: "/app/new" },
  { icon: FileUp, title: "Upload a document", desc: "Upload a PO, invoice, or spec sheet", href: "/app/new" },
  { icon: Bot, title: "Connect Telegram bot", desc: "Let the bot listen to your procurement channels", href: "/app/new" },
];

export default function AppDashboard() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Turn messy procurement conversations into structured agreements
        </h1>
        <p className="mt-2 text-gray-500">
          Paste a chat, forward an email, or upload a document. ProofProcure extracts the terms, both parties confirm, and payment executes automatically.
        </p>
      </div>

      {/* Quick start */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Agreements list */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your agreements</h2>
          <span className="text-sm text-gray-400">{SEED_AGREEMENTS.length} total</span>
        </div>
        <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {SEED_AGREEMENTS.map((agr) => (
            <Link
              key={agr.id}
              href={`/app/agreement/${agr.id}`}
              className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <p className="truncate text-sm font-medium">{agr.item}</p>
                  <StatusBadge status={agr.state} />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {agr.counterparty} · {agr.quantity} × ${agr.price} · ${agr.total.toLocaleString()}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-gray-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
