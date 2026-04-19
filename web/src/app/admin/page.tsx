"use client";

import { useEffect, useState } from "react";

interface Stats {
  counts: Record<string, number>;
  recentAgreements: Record<string, unknown>[];
  recentUsers: Record<string, unknown>[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const statuses = ["draft", "ratified", "funded", "delivered", "payment_released"];

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>

      {/* Status counts */}
      <div className="grid gap-3 sm:grid-cols-5">
        {statuses.map((s) => (
          <div key={s} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-400 capitalize">{s.replace("_", " ")}</p>
            <p className="mt-1 text-2xl font-semibold">{stats?.counts[s] ?? "—"}</p>
          </div>
        ))}
      </div>

      {/* Recent agreements */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent agreements</h2>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(stats?.recentAgreements || []).map((a: Record<string, unknown>) => (
                <tr key={a.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs">{(a.id as string).slice(0, 12)}</td>
                  <td className="px-4 py-2">{a.item as string}</td>
                  <td className="px-4 py-2 capitalize">{(a.status as string).replace("_", " ")}</td>
                  <td className="px-4 py-2">${a.total as string}</td>
                  <td className="px-4 py-2 text-gray-400">{(a.created_at as string).slice(0, 10)}</td>
                </tr>
              ))}
              {!stats?.recentAgreements?.length && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No agreements yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent users */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent users</h2>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(stats?.recentUsers || []).map((u: Record<string, unknown>) => (
                <tr key={u.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{u.email as string}</td>
                  <td className="px-4 py-2 capitalize">{u.role as string}</td>
                  <td className="px-4 py-2 text-gray-400">{(u.created_at as string).slice(0, 10)}</td>
                </tr>
              ))}
              {!stats?.recentUsers?.length && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
