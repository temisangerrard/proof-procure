"use client";

import { useState } from "react";
import type { AgreementResponse } from "@/lib/api";
import { patchAgreement } from "@/lib/api";

const FIELD_LABELS: Record<string, string> = {
  item: "Item",
  quantity: "Quantity",
  price: "Price per Unit (USDC)",
  total: "Total (USDC)",
  confirmation_type: "Confirmation Type",
  confirmation_window: "Confirmation Window (hours)",
  payment_condition: "Payment Condition",
};

const CONFIRMATION_TYPES = [
  "BUYER_CONFIRMATION",
  "SHIPPING_CONFIRMATION",
  "RECEIPT_UPLOAD",
];

export function ProposalView({
  agreement,
  token,
}: {
  agreement: AgreementResponse;
  token: string;
}) {
  const data = agreement.extracted_data;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!data || !draft) {
    return (
      <main className="flex items-center justify-center min-h-screen p-4">
        <p className="text-gray-500">No agreement data available.</p>
      </main>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await patchAgreement(token, draft);
      setEditing(false);
      setStatus({ type: "success", msg: "Proposal updated" });
    } catch {
      setStatus({ type: "error", msg: "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setStatus({ type: "success", msg: "Agreement confirmed. Awaiting counterparty." });
  };

  const handleReject = () => {
    setStatus({ type: "error", msg: "Agreement rejected." });
  };

  const updateField = (key: string, value: string | number) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/agreement/${token}`
      : "";

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Procurement Proposal</h1>
        <p className="text-sm text-gray-500 mt-1">
          Status:{" "}
          <span className="font-medium text-gray-700">{agreement.state}</span>
          {" · "}Confidence: {((agreement.confidence_score ?? 0) * 100).toFixed(0)}%
        </p>
      </header>

      {status && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            status.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {status.msg}
        </div>
      )}

      {/* Parties */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Parties</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">Buyer</p>
            <p className="font-medium">{draft.buyer?.name || "—"}</p>
            {draft.buyer?.email && (
              <p className="text-sm text-gray-500">{draft.buyer.email}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400">Supplier</p>
            <p className="font-medium">{draft.supplier?.name || "—"}</p>
            {draft.supplier?.email && (
              <p className="text-sm text-gray-500">{draft.supplier.email}</p>
            )}
          </div>
        </div>
      </section>

      {/* Agreement Details */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500">
            Agreement Details
          </h2>
          {!editing && !confirmed && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          )}
        </div>

        <div className="space-y-3">
          {(["item", "quantity", "price", "total"] as const).map((key) => (
            <div key={key}>
              <label className="text-xs text-gray-400">
                {FIELD_LABELS[key]}
              </label>
              {editing ? (
                <input
                  type={key === "item" ? "text" : "number"}
                  value={draft[key] ?? ""}
                  onChange={(e) =>
                    updateField(
                      key,
                      key === "item" ? e.target.value : Number(e.target.value)
                    )
                  }
                  className="block w-full mt-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <p className="font-medium">
                  {key === "price" || key === "total"
                    ? `${draft[key]} USDC`
                    : draft[key]}
                </p>
              )}
            </div>
          ))}

          <div>
            <label className="text-xs text-gray-400">Confirmation Type</label>
            {editing ? (
              <select
                value={draft.confirmation_type}
                onChange={(e) =>
                  updateField("confirmation_type", e.target.value)
                }
                className="block w-full mt-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CONFIRMATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            ) : (
              <p className="font-medium">
                {draft.confirmation_type.replace(/_/g, " ")}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-400">Payment Condition</label>
            {editing ? (
              <input
                type="text"
                value={draft.payment_condition ?? ""}
                onChange={(e) =>
                  updateField("payment_condition", e.target.value)
                }
                className="block w-full mt-1 px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <p className="font-medium">{draft.payment_condition}</p>
            )}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-white rounded-lg border p-4 mb-4">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Timeline</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery Window</span>
            <span>
              {new Date(draft.delivery_window.start).toLocaleDateString()} –{" "}
              {new Date(draft.delivery_window.end).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Confirmation Window</span>
            <span>{(draft.confirmation_window / 3600).toFixed(0)} hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Expiry</span>
            <span>{new Date(draft.expiry).toLocaleDateString()}</span>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="flex flex-col gap-3">
        {editing ? (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => {
                setDraft(data);
                setEditing(false);
              }}
              className="flex-1 border border-gray-300 py-2.5 rounded font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : !confirmed ? (
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 text-white py-2.5 rounded font-medium hover:bg-green-700"
            >
              Confirm Agreement
            </button>
            <button
              onClick={handleReject}
              className="flex-1 bg-red-600 text-white py-2.5 rounded font-medium hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        ) : null}

        {/* Share Link */}
        <div className="bg-gray-100 rounded p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">
            Share this link with the counterparty
          </p>
          <code className="text-sm text-blue-600 break-all">{shareUrl}</code>
        </div>
      </section>
    </main>
  );
}
