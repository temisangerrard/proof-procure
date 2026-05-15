import {
  ArrowRight,
  BadgeDollarSign,
  CreditCard,
  Landmark,
  PiggyBank,
  RefreshCcw,
  ShieldCheck,
  Sprout,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PRODUCTS = [
  {
    name: "Earn",
    icon: Sprout,
    status: "Live tools",
    line: "Compare real USDC yield markets.",
    provider: "Aave, Morpho, Maple",
    out: "Varies by tool",
    risk: "Market risk",
    action: "Choose tool",
    href: "/app/reserves/earn",
    tone: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  },
  {
    name: "Change money",
    icon: RefreshCcw,
    status: "Arc testnet",
    line: "Get stablecoin FX quotes.",
    provider: "Circle StableFX",
    out: "Quote first",
    risk: "Quote risk",
    action: "Get quote",
    href: "/app/reserves/change",
    tone: "bg-blue-50 text-blue-900 ring-blue-200",
  },
  {
    name: "Cash out",
    icon: Landmark,
    status: "Partner needed",
    line: "Send money to bank or mobile money.",
    provider: "Off-ramp partners",
    out: "By country",
    risk: "Partner risk",
    action: "See path",
    href: "/app/reserves/cash-out",
    tone: "bg-amber-50 text-amber-900 ring-amber-200",
  },
  {
    name: "Card",
    icon: CreditCard,
    status: "Waitlist",
    line: "Spend operating capital.",
    provider: "Card issuing partner",
    out: "When issued",
    risk: "Card controls",
    action: "Get card",
    href: "/app/reserves/card",
    tone: "bg-slate-100 text-slate-900 ring-slate-200",
  },
];

export default function GrowPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-sm md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
              <PiggyBank className="size-4" />
              Grow
            </p>
            <p className="mt-6 text-sm font-medium text-slate-300">Tools</p>
            <h1 className="mt-2 text-5xl font-semibold tracking-tight tabular-nums md:text-7xl">
              Grow
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              Put waiting money to work after your bills are covered.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Bucket
          label="Free"
          value="-"
          note="Use now"
          icon={WalletCards}
        />
        <Bucket
          label="Earning"
          value="-"
          note="No active position"
          icon={Sprout}
        />
        <Bucket
          label="Coming out"
          value="-"
          note="On the way"
          icon={RefreshCcw}
        />
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              <Sprout className="size-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">Earn</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  Earning
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Open a real yield tool and choose the right market.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/app/reserves/earn">
              <Button className="h-11">View</Button>
            </a>
            <Button variant="outline" className="h-11" disabled>Withdraw</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {PRODUCTS.map((product) => (
          <div
            key={product.name}
            className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`flex size-12 items-center justify-center rounded-2xl ring-1 ${product.tone}`}>
                <product.icon className="size-6" />
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {product.status}
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-semibold">{product.name}</h2>
            <p className="mt-2 text-sm text-slate-500">{product.line}</p>

            <div className="mt-5 grid gap-2 rounded-2xl bg-slate-50 p-4">
              <ProductLine label="Tool" value={product.provider} />
              <ProductLine label="Exit" value={product.out.replace("Exit: ", "")} />
              <ProductLine label="Risk" value={product.risk} />
              <ProductLine label="Use" value="Money not needed for bills" />
            </div>

            <a href={product.href}>
              <Button className="mt-5 h-11 w-full justify-between">
                {product.action}
                <ArrowRight className="size-4" />
              </Button>
            </a>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold">How Grow works</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Step number="1" label="Check dates" icon={ShieldCheck} />
          <Step number="2" label="Use available" icon={PiggyBank} />
          <Step number="3" label="Choose return" icon={BadgeDollarSign} />
        </div>
      </section>
    </div>
  );
}

function Bucket({
  label,
  value,
  note,
  icon: Icon,
  active = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof ShieldCheck;
  active?: boolean;
}) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ring-1 ${active ? "bg-emerald-50 ring-emerald-200" : "bg-white ring-slate-200"}`}>
      <div className="flex items-center justify-between">
        <div className={`flex size-11 items-center justify-center rounded-2xl ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          <Icon className="size-5" />
        </div>
        {active && (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Active
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function ProductLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function Step({
  number,
  label,
  icon: Icon,
}: {
  number: string;
  label: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
        {number}
      </span>
      <Icon className="size-5 text-slate-500" />
      <span className="font-semibold">{label}</span>
    </div>
  );
}
