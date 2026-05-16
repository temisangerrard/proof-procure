"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SupplierOption {
  id: string;
  name: string;
  currency: string;
}

export default function AddBillPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [title, setTitle] = useState("Supplier payment");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSuppliers() {
      setLoading(true);
      const response = await fetch("/api/suppliers");
      const data = (await response.json()) as { suppliers?: SupplierOption[] };
      const items = data.suppliers || [];
      setSuppliers(items);
      setSupplierId(items[0]?.id || "");
      setLoading(false);
    }

    void loadSuppliers();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supplierId || !amount) return;
    setSaving(true);
    setError("");

    const supplier = suppliers.find((item) => item.id === supplierId);
    const response = await fetch("/api/bills", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        supplierId,
        title,
        amount,
        currency: supplier?.currency || "USD",
        dueDate,
      }),
    });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error || "Could not add bill.");
      setSaving(false);
      return;
    }

    router.push("/app/obligations");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
      >
        <ArrowLeft className="size-3.5" /> Back
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add bill</h1>
        <p className="mt-1 text-sm text-gray-500">Amount, person, pay date.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <Loader2 className="size-5 animate-spin text-slate-400" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <WalletCards className="size-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">
            Add a supplier first
          </h2>
          <p className="mt-2 text-slate-500">A bill needs someone to pay.</p>
          <Link href="/app/onboarding">
            <Button className="mt-5 h-12 px-5">Start setup</Button>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
        >
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Person</span>
            <select
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-medium outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
            >
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Amount</span>
            <Input
              className="h-14 rounded-2xl px-4 text-lg"
              inputMode="decimal"
              placeholder="18200"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Pay date
            </span>
            <Input
              className="h-14 rounded-2xl px-4 text-lg"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Name</span>
            <Input
              className="h-14 rounded-2xl px-4 text-lg"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          {error && (
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          )}

          <Button
            type="submit"
            disabled={saving || !supplierId || !amount}
            className="h-12 gap-2 px-5"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Add bill
          </Button>
        </form>
      )}
    </div>
  );
}
