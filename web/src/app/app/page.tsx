import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Camera,
  CheckCircle2,
  Clock3,
  Plus,
  ShieldCheck,
  UserPlus,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { listBills, listSuppliers } from "@/lib/procure-store";
import type { BillRecord } from "@/lib/procure-store";
import { formatDate, formatMoney } from "@/lib/procurement-demo";

const MONEY_ACTIONS = [
  {
    label: "Add money",
    helper: "Top up",
    href: "/app/account",
    icon: Plus,
    className: "bg-slate-950 text-white",
  },
  {
    label: "Add supplier",
    helper: "Supplier",
    href: "/app/suppliers",
    icon: UserPlus,
    className: "bg-white text-slate-950 ring-1 ring-slate-200",
  },
  {
    label: "Add bill",
    helper: "Amount",
    href: "/app/new",
    icon: Camera,
    className: "bg-white text-slate-950 ring-1 ring-slate-200",
  },
  {
    label: "Pay",
    helper: "Send",
    href: "/app/payments",
    icon: Banknote,
    className: "bg-emerald-600 text-white",
  },
];

export default async function AppDashboard() {
  const user = await getSessionUser();
  const bills = user ? await listBills(user) : [];
  const suppliers = user ? await listSuppliers(user) : [];

  const unpaid = bills.filter((bill) => bill.status !== "paid");
  const paid = bills.filter((bill) => bill.status === "paid");
  const short = bills.filter(
    (bill) => bill.status === "short" || bill.status === "draft",
  );
  const ready = bills.filter((bill) => bill.status === "ready");
  const totalDue = unpaid.reduce((sum, bill) => sum + bill.amount, 0);
  const totalPaid = paid.reduce((sum, bill) => sum + bill.amount, 0);
  const readiness = unpaid.length
    ? Math.round((ready.length / unpaid.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-sm md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
              <CheckCircle2 className="size-4" />
              {unpaid.length ? `${readiness}% ready` : "Start here"}
            </p>
            <p className="mt-6 text-sm font-medium text-slate-300">
              Bills to pay
            </p>
            <h1 className="mt-2 text-5xl font-semibold tracking-tight tabular-nums md:text-7xl">
              {formatMoney(totalDue)}
            </h1>
          </div>

          <div className="grid min-w-64 gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/10">
            <MiniBalance label="Suppliers" value={`${suppliers.length}`} />
            <MiniBalance label="Bills" value={`${bills.length}`} />
            <MiniBalance label="Paid" value={formatMoney(totalPaid)} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {MONEY_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`min-h-32 rounded-3xl p-4 shadow-sm transition-transform active:scale-[0.96] ${action.className}`}
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-black/5 ring-1 ring-black/5">
              <action.icon className="size-6" />
            </div>
            <p className="mt-4 text-lg font-semibold">{action.label}</p>
            <p className="mt-1 text-sm opacity-70">{action.helper}</p>
          </Link>
        ))}
      </section>

      {bills.length === 0 ? (
        <EmptyStart hasSupplier={suppliers.length > 0} />
      ) : (
        <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <WalletCards className="size-5 text-slate-400" />
                <h2 className="font-semibold">Bills</h2>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {bills.map((bill) => (
                <PaymentRow key={bill.id} bill={bill} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="size-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold">Status</h2>
            <div className="mt-5 space-y-3">
              <PlainState icon={CheckCircle2} label={`${ready.length} ready`} />
              <PlainState icon={Clock3} label={`${short.length} need money`} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyStart({ hasSupplier }: { hasSupplier: boolean }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        {hasSupplier ? (
          <WalletCards className="size-7" />
        ) : (
          <UserPlus className="size-7" />
        )}
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">
        {hasSupplier ? "Add your first bill" : "Add your first supplier"}
      </h2>
      <p className="mt-2 max-w-lg text-slate-500">
        {hasSupplier
          ? "Enter the amount and pay date so the app can show Ready, Short, or Paid."
          : "Start with one person or company you pay. Then add a bill."}
      </p>
      <Link href={hasSupplier ? "/app/new" : "/app/onboarding"}>
        <Button className="mt-5 h-12 gap-2 px-5">
          {hasSupplier ? "Add bill" : "Start setup"}{" "}
          <ArrowRight className="size-4" />
        </Button>
      </Link>
    </section>
  );
}

function MiniBalance({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/10 px-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="font-semibold tabular-nums text-white">{value}</span>
    </div>
  );
}

function PaymentRow({ bill }: { bill: BillRecord }) {
  const paid = bill.status === "paid";
  const short = bill.status === "short" || bill.status === "draft";
  const label = paid ? "Paid" : short ? "Short" : "Ready";
  const sent = bill.status === "sent";
  const displayLabel = sent ? "Sent" : label;
  const Icon = paid ? CheckCircle2 : short ? AlertTriangle : ShieldCheck;
  const style = paid
    ? "bg-slate-100 text-slate-600 ring-slate-200"
    : short
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-emerald-50 text-emerald-700 ring-emerald-200";

  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ${style}`}
          >
            <Icon className="size-4" />
            {displayLabel}
          </span>
          <p className="font-semibold">{bill.supplier_name || "Supplier"}</p>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {bill.title} {bill.due_date ? `· ${formatDate(bill.due_date)}` : ""}
        </p>
      </div>
      <div className="text-left sm:text-right">
        <p className="text-xl font-semibold tabular-nums">
          {formatMoney(bill.amount, bill.currency)}
        </p>
        <Link
          href="/app/payments"
          className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-950"
        >
          Pay <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function PlainState({
  icon: Icon,
  label,
}: {
  icon: typeof CheckCircle2;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <Icon className="size-5 text-slate-500" />
      <span className="font-semibold">{label}</span>
    </div>
  );
}
