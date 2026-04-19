"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Agr {
  id: string;
  buyer_id: string;
  supplier_email: string;
  item: string;
  total: string;
  status: string;
  created_at: string;
}

const STATUSES = ["all", "draft", "ratified", "funded", "delivered", "payment_released", "rejected", "expired"];

export default function AdminAgreementsPage() {
  const [agreements, setAgreements] = useState<Agr[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/agreements")
      .then((r) => r.json())
      .then((d: any) => setAgreements(d.agreements || []))
      .catch(() => {});
  }, []);

  const filtered = filter === "all" ? agreements : agreements.filter((a) => a.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">All Agreements</h1>

      <div className="flex gap-1.5 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Buyer</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-2">
                  <Link href={`/app/agreement/${a.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                    {a.id.slice(0, 12)}
                  </Link>
                </td>
                <td className="px-4 py-2 text-xs">{a.buyer_id.slice(0, 8)}</td>
                <td className="px-4 py-2">{a.supplier_email || "—"}</td>
                <td className="px-4 py-2">{a.item}</td>
                <td className="px-4 py-2">${a.total}</td>
                <td className="px-4 py-2 capitalize">{a.status.replace("_", " ")}</td>
                <td className="px-4 py-2 text-gray-400">{a.created_at.slice(0, 10)}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No agreements</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
