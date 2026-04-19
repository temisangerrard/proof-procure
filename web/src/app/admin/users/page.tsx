"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  agreement_count?: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d: any) => setUsers(d.users || []))
      .catch(() => {});
  }, []);

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Users</h1>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Agreements</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2 capitalize">{u.role}</td>
                <td className="px-4 py-2">{u.agreement_count ?? 0}</td>
                <td className="px-4 py-2 text-gray-400">{u.created_at.slice(0, 10)}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleAdmin(u.id, u.role)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {u.role === "admin" ? "Remove admin" : "Make admin"}
                  </button>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
