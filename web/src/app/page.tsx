import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Globe2,
  PiggyBank,
  Plus,
  Send,
  ShieldCheck,
  UserPlus,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const steps = [
  {
    title: "Add money",
    text: "Put dollars in your account.",
    icon: Plus,
  },
  {
    title: "Add supplier",
    text: "Save who you pay.",
    icon: UserPlus,
  },
  {
    title: "Add bill",
    text: "Type the amount and date.",
    icon: WalletCards,
  },
  {
    title: "Pay",
    text: "Check once. Then send.",
    icon: Send,
  },
];

const proof = [
  "Dollar balance",
  "Fast supplier payment",
  "Bill shows Paid",
  "Money can grow while waiting",
];

const audiences = ["Importers", "Traders", "Wholesalers", "Distributors", "Sourcing teams"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] text-slate-950">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/90 text-white backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/app" className="hidden text-sm font-medium text-slate-300 hover:text-white sm:inline">
              Try app
            </Link>
            <Link href="/login">
              <Button size="lg" className="h-10 bg-white px-4 text-slate-950 hover:bg-slate-100">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[92svh] overflow-hidden bg-slate-950 pt-16 text-white">
        <div className="absolute inset-0 opacity-55">
          <ProductPreview />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.82)_42%,rgba(2,6,23,0.34)_100%)]" />

        <div className="relative z-10 mx-auto grid min-h-[calc(92svh-4rem)] max-w-7xl content-center px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,620px)_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/12 px-3 py-1.5 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
              <Globe2 className="size-4" />
              Know who to pay next
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Pay suppliers abroad from one dollar account
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300 text-pretty">
              Add money, save suppliers, enter bills, and pay when goods are ready. ProofProcure shows Ready, Short, and Paid so nobody has to guess.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <Button size="lg" className="h-12 w-full gap-2 bg-emerald-400 px-5 text-base text-slate-950 hover:bg-emerald-300 sm:w-auto">
                  Try the app <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/app">
                <Button size="lg" variant="outline" className="h-12 w-full border-white/20 bg-white/5 px-5 text-base text-white hover:bg-white/10 sm:w-auto">
                  See demo
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {audiences.map((item) => (
                <span key={item} className="rounded-full bg-white/8 px-3 py-1.5 text-sm font-medium text-slate-300 ring-1 ring-white/10">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {proof.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CheckCircle2 className="size-5 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-5xl">
            Simple steps. Clear words. One final check.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <step.icon className="size-6" />
                </div>
                <span className="text-sm font-semibold text-slate-400 tabular-nums">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Why use it</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-5xl">
              See who is ready, who needs money, and who is paid.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-slate-300 text-pretty">
              Big buttons and plain status labels show the next step. Every payment gets a final check before money leaves.
            </p>
          </div>

          <div className="grid gap-3">
            <ValueRow icon={ShieldCheck} title="Ready" text="Money is there for this bill." />
            <ValueRow icon={CircleDollarSign} title="Short" text="Add money before paying." />
            <ValueRow icon={Banknote} title="Paid" text="Payment is done." />
            <ValueRow icon={PiggyBank} title="Grow" text="Put waiting money to work." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Built for trade</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-5xl">
              One account for supplier money.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-600 text-pretty">
              Use it to hold dollars, pay suppliers, cash out locally, and grow money that is waiting.
            </p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <PiggyBank className="size-6" />
              </div>
              <div>
                <p className="font-semibold">Grow waiting money</p>
                <p className="text-sm text-slate-500">Use money you do not need today.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <ShelfItem label="Earn" value="Get a rate" />
              <ShelfItem label="Change money" value="Move to local money" />
              <ShelfItem label="Cash out" value="Withdraw near you" />
              <ShelfItem label="Card" value="Spend from the account" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Ready to pay your next supplier?</h2>
            <p className="mt-1 text-slate-500">Try the payment flow.</p>
          </div>
          <Link href="/app">
            <Button size="lg" className="h-12 gap-2 px-5">
              Try app <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#f6f8f5]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© 2026 ProofProcure</span>
          <span>Keep supplier money ready before payment.</span>
        </div>
      </footer>
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="absolute right-[-120px] top-24 hidden w-[760px] rotate-[-3deg] rounded-[32px] bg-white p-4 shadow-2xl ring-1 ring-white/20 lg:block">
      <div className="rounded-[24px] bg-[#f6f8f5] p-5 text-slate-950">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Balance</p>
            <p className="mt-2 text-6xl font-semibold tracking-tight tabular-nums">$48,200</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            Ready
          </span>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-3">
          {[
            ["Add", Plus],
            ["Person", UserPlus],
            ["Bill", WalletCards],
            ["Pay", Send],
          ].map(([label, Icon]) => (
            <div key={label as string} className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
              <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Icon className="size-5" />
              </div>
              <p className="mt-3 text-sm font-semibold">{label as string}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <PreviewBill name="Mei Lin Trading Co." amount="$18,200" state="Ready" />
          <PreviewBill name="Ankara Textile Works" amount="$12,400" state="Short" warning />
          <PreviewBill name="Sai Components" amount="$2,300" state="Paid" />
        </div>
      </div>
    </div>
  );
}

function PreviewBill({
  name,
  amount,
  state,
  warning = false,
}: {
  name: string;
  amount: string;
  state: string;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 p-4 last:border-b-0">
      <div>
        <p className="font-semibold">{name}</p>
        <p className="mt-1 text-sm text-slate-500">{amount}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${warning ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
        {state}
      </span>
    </div>
  );
}

function ValueRow({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
      </div>
    </div>
  );
}

function ShelfItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
      <span className="font-semibold">{label}</span>
      <span className="text-right text-sm text-slate-500">{value}</span>
    </div>
  );
}
