"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";

export default function NewAgreementPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_input: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Extraction failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/app" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="size-3.5" /> Back
      </Link>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">New agreement</h1>
        <p className="mt-1 text-sm text-gray-500">
          Paste a procurement conversation — from Telegram, WhatsApp, email, or anywhere. ProofProcure will extract the terms.
        </p>
      </div>

      {result ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="font-medium text-emerald-800">Agreement created</p>
          <p className="mt-1 text-sm text-emerald-600">
            Review and confirm the extracted terms.
          </p>
          <Link href={`/app/agreement/${result.id}`}>
            <Button size="sm" className="mt-4">
              View agreement
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Paste your conversation here...\n\nExample:\n"Hey Kwame, can you do 500 units of Grade A shea butter at $12.40 each? Need delivery by March 15. Payment on confirmed delivery."\n\n"Yes, 500 units at $12.40 works. I can ship by March 10, should arrive by the 15th."`}
            rows={10}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-300 focus:border-gray-300 focus:ring-2 focus:ring-gray-900/5 resize-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={loading || !input.trim()} className="gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Extract terms
          </Button>
        </form>
      )}
    </div>
  );
}
