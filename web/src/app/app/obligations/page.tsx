import Link from "next/link";
import { ArrowRight, CalendarDays, FilePlus2, Upload, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { listBills, listSuppliers } from "@/lib/procure-store";
import { formatDate, formatMoney } from "@/lib/procurement-demo";

const FILTERS = ["All", "Short", "Ready", "Paid"];

export default async function ObligationsPage() {
  const user = await getSessionUser();
  const bills = user ? await listBills(user) : [];
  const suppliers = user ? await listSuppliers(user) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bills</h1>
          <p className="mt-1 text-sm text-slate-500">What needs paying.</p>
        </div>
        <div className="flex gap-2">
          <Link href={suppliers.length ? "/app/new" : "/app/onboarding"}>
            <Button variant="outline" className="h-11 gap-1.5">
              <FilePlus2 className="size-4" />
              Add bill
            </Button>
          </Link>
          <Button className="h-11 gap-1.5" disabled>
            <Upload className="size-4" />
            Upload invoice
          </Button>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <WalletCards className="size-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">No bills yet</h2>
          <p className="mt-2 max-w-lg text-slate-500">
            Add a supplier and bill so the app can show whether payment is Ready, Short, or Paid.
          </p>
          <Link href={suppliers.length ? "/app/new" : "/app/onboarding"}>
            <Button className="mt-5 h-12 gap-2 px-5">
              {suppliers.length ? "Add bill" : "Start setup"} <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                className="h-10 shrink-0 rounded-lg bg-white px-4 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-100"
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-100 px-5 py-4 text-sm font-medium text-slate-500 lg:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_auto]">
              <span>Bill</span>
              <span className="hidden lg:block">Person</span>
              <span className="hidden lg:block">Due</span>
              <span className="hidden lg:block">Status</span>
              <span>Amount</span>
            </div>
            <div className="divide-y divide-slate-100">
              {bills.map((bill) => {
                const paid = bill.status === "paid";
                const short = bill.status === "short" || bill.status === "draft";
                const statusClass = paid
                  ? "bg-slate-100 text-slate-600 ring-slate-200"
                  : short
                    ? "bg-rose-50 text-rose-700 ring-rose-200"
                    : "bg-emerald-50 text-emerald-700 ring-emerald-200";

                return (
                  <div
                    key={bill.id}
                    className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_0.8fr_0.7fr_0.7fr_auto]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{bill.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{bill.source}</p>
                    </div>
                    <p className="text-sm text-slate-600">{bill.supplier_name || "Supplier"}</p>
                    <p className="flex items-center gap-1.5 text-sm text-slate-600">
                      <CalendarDays className="size-3.5 text-slate-400" />
                      {bill.due_date ? formatDate(bill.due_date) : "No date"}
                    </p>
                    <div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass}`}>
                        {paid ? "Paid" : short ? "Short" : "Ready"}
                      </span>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="font-semibold tabular-nums">
                        {formatMoney(bill.amount, bill.currency)}
                      </p>
                      <Link
                        href="/app/payments"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-950"
                      >
                        Pay <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
