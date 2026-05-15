import Link from "next/link";
import { ArrowRight, MapPin, Phone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { listBills, listSuppliers } from "@/lib/procure-store";
import { formatDate, formatMoney } from "@/lib/procurement-demo";

export default async function SuppliersPage() {
  const user = await getSessionUser();
  const suppliers = user ? await listSuppliers(user) : [];
  const bills = user ? await listBills(user) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <p className="mt-1 text-sm text-slate-500">Who you pay.</p>
        </div>
        <Link href="/app/onboarding">
          <Button className="h-11 gap-2">
            <UserPlus className="size-4" />
            Add person
          </Button>
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <UserPlus className="size-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">Add who you pay first</h2>
          <p className="mt-2 max-w-lg text-slate-500">One supplier is enough to start. Add the bill after.</p>
          <Link href="/app/onboarding">
            <Button className="mt-5 h-12 gap-2 px-5">
              Start setup <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          {suppliers.map((supplier) => {
            const nextBill = bills
              .filter((bill) => bill.supplier_id === supplier.id && bill.status !== "paid")
              .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))[0];
            const initials = supplier.name
              .split(" ")
              .slice(0, 2)
              .map((part) => part[0])
              .join("");

            return (
              <Link
                key={supplier.id}
                href="/app/obligations"
                className="grid gap-3 border-b border-slate-100 p-4 transition-colors last:border-b-0 hover:bg-slate-50 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-600">
                    {initials || "P"}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{supplier.name}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                      {supplier.country && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {supplier.country}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3.5" />
                        Contact
                      </span>
                    </div>
                    {nextBill ? (
                      <p className="mt-2 text-sm font-medium text-slate-700">
                        Next: {formatMoney(nextBill.amount, nextBill.currency)} {nextBill.due_date ? `· ${formatDate(nextBill.due_date)}` : ""}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm font-medium text-slate-500">No bill yet</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 pl-16 sm:justify-end sm:pl-0">
                  <span className="text-sm font-semibold text-slate-500">View</span>
                  <ArrowRight className="size-4 shrink-0 text-slate-300" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
