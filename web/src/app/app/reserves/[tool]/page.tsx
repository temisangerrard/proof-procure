import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Landmark,
  RefreshCcw,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOL_DETAILS = {
  earn: {
    title: "Earn",
    icon: Sprout,
    status: "Live tools",
    summary: "Compare real USDC yield markets before moving money.",
    rows: [
      ["Best for", "Money not needed for bills"],
      ["Risk", "Smart contract and market risk"],
      ["Exit", "Depends on the market"],
      ["Before using", "Check supplier bills first"],
    ],
    links: [
      {
        label: "Aave",
        href: "https://app.aave.com/",
        note: "Large DeFi lending markets.",
      },
      {
        label: "Morpho",
        href: "https://app.morpho.org/",
        note: "Curated vaults and lending markets.",
      },
      {
        label: "Maple",
        href: "https://app.maple.finance/",
        note: "Managed stablecoin yield products.",
      },
    ],
  },
  change: {
    title: "Change money",
    icon: RefreshCcw,
    status: "Arc testnet",
    summary: "Use StableFX for quote-based stablecoin FX on Arc.",
    rows: [
      ["Best for", "Paying in another currency"],
      ["Quote", "Request first, accept after checking"],
      ["Settlement", "Arc"],
      ["Before using", "Confirm supplier currency"],
    ],
    links: [
      {
        label: "StableFX docs",
        href: "https://developers.circle.com/stablefx/concepts/technical-guide",
        note: "RFQ quotes and Arc settlement.",
      },
      {
        label: "Circle console",
        href: "https://console.circle.com/",
        note: "Manage API access.",
      },
    ],
  },
  "cash-out": {
    title: "Cash out",
    icon: Landmark,
    status: "Partner needed",
    summary:
      "Choose payout partners by country before wiring this into the app.",
    rows: [
      ["Best for", "Local bank or mobile money"],
      ["Route", "Depends on country"],
      ["Status", "Needs partner API"],
      ["Before using", "Choose payout country"],
    ],
    links: [
      {
        label: "Yellow Card",
        href: "https://www.yellowcard.io/business/",
        note: "Africa-focused stablecoin business rails.",
      },
      {
        label: "dLocal",
        href: "https://www.dlocal.com/",
        note: "Local payment rails in emerging markets.",
      },
      {
        label: "EBANX",
        href: "https://www.ebanx.com/",
        note: "Local payments in Latin America and other markets.",
      },
    ],
  },
  card: {
    title: "Card",
    icon: CreditCard,
    status: "Partner needed",
    summary: "Card spend needs an issuer and controls before going live.",
    rows: [
      ["Best for", "Operating spend"],
      ["Status", "Issuer required"],
      ["Controls", "Limits and approval rules"],
      ["Before using", "Pick issuing partner"],
    ],
    links: [
      {
        label: "Visa business",
        href: "https://usa.visa.com/run-your-business/small-business-tools.html",
        note: "Card network path.",
      },
      {
        label: "Mastercard business",
        href: "https://www.mastercard.us/en-us/business/overview.html",
        note: "Card network path.",
      },
    ],
  },
} as const;

export default async function GrowToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const detail =
    TOOL_DETAILS[tool as keyof typeof TOOL_DETAILS] || TOOL_DETAILS.earn;
  const Icon = detail.icon;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/app/reserves"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"
      >
        <ArrowLeft className="size-4" />
        Grow
      </Link>

      <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-sm md:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <Icon className="size-7" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              {detail.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              {detail.summary}
            </p>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
            {detail.status}
          </span>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3">
          {detail.rows.map(([label, value]) => (
            <InfoRow key={label} label={label} value={value} />
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        {detail.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-transform active:scale-[0.96]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{link.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {link.note}
                </p>
              </div>
              <ExternalLink className="size-5 shrink-0 text-slate-400" />
            </div>
          </a>
        ))}
      </section>

      <section className="rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-200">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-950">
          <ShieldCheck className="size-4" />
          Check bills before moving money.
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          Grow tools should only use money that is not needed for supplier
          payments.
        </p>
      </section>

      <Link href="/app/payments">
        <Button variant="outline" className="h-12 w-full text-base">
          Check bills first
        </Button>
      </Link>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-950">
        {value}
      </span>
    </div>
  );
}
