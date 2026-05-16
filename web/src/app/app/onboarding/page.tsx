"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Globe2,
  WalletCards,
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";
import { CURRENCIES } from "@/lib/currencies";

type Step = 0 | 1 | 2 | 3;

const INDUSTRY_TYPES = [
  { label: "Importer", emoji: "📦" },
  { label: "Exporter", emoji: "🚢" },
  { label: "Wholesaler", emoji: "🏪" },
  { label: "Distributor", emoji: "📮" },
  { label: "Sourcing Agent", emoji: "🔍" },
  { label: "Manufacturer", emoji: "🏭" },
  { label: "Other", emoji: "🔧" },
];

const CORRIDOR_CODES = ["CN","IN","VN","TR","AE","BD","PK","TH","MY","ID","GB","DE","IT","US"];
const TRADE_CORRIDORS = [
  ...CORRIDOR_CODES.map((code) => {
    const c = COUNTRIES.find((x) => x.code === code);
    return { code, label: c?.name ?? code, flag: c?.flag ?? "" };
  }),
  { code: "OTHER", label: "Other", flag: "🌍" },
];

const PRODUCT_CATEGORIES = [
  "Electronics",
  "Textiles & Apparel",
  "Food & Agriculture",
  "Raw Materials",
  "Auto Parts",
  "Machinery",
  "Consumer Goods",
  "Chemicals",
  "Building Materials",
  "Other",
];

const DEAL_SIZES = ["Under $5k", "$5k–$50k", "$50k–$500k", "Over $500k"];

const SUPPLIER_COUNTS = ["1–5", "6–20", "20+"];

const PAYMENT_METHODS = [
  "Bank wire",
  "Cash / informal",
  "Letter of credit",
  "Cryptocurrency",
  "Haven't started",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [country, setCountry] = useState("");
  const [industryType, setIndustryType] = useState("");

  const [tradeCorridors, setTradeCorridors] = useState<string[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [dealSize, setDealSize] = useState("");

  const [mainCurrency, setMainCurrency] = useState("USD");
  const [supplierCount, setSupplierCount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const ACCOUNT_ADDRESS = "0x742d35Cc6634C05329Bc7fDc742d...8f3a";

  function toggleArr(
    arr: string[],
    setArr: (v: string[]) => void,
    val: string,
  ) {
    setArr(arr.includes(val) ? arr.filter((i) => i !== val) : [...arr, val]);
  }

  function next() {
    setStep((current) => Math.min(current + 1, 3) as Step);
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0) as Step);
  }

  async function finish() {
    setSaving(true);
    setError("");
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessName,
          country,
          industryType,
          tradeCorridors,
          productCategories,
          dealSize,
          mainCurrency,
          supplierCount,
          paymentMethod,
        }),
      });
    } catch {
      setError("Could not save your details. You can update them later.");
    } finally {
      router.push("/app");
    }
  }

  async function copyAddress() {
    await navigator.clipboard.writeText("0x742d35Cc6634C05329Bc7fDc742d8f3a");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stepCount = 4;
  const completion = ((step + 1) / stepCount) * 100;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Set up your account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Step {step + 1} of {stepCount}
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.push("/app")}>
          Skip
        </Button>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width]"
          style={{ width: `${completion}%` }}
        />
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
          {step === 0 && (
            <Panel
              icon={Building2}
              title="Your business"
              text="This helps us show the right payment options."
            >
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Business name
                </span>
                <Input
                  className="h-14 rounded-2xl px-4 text-lg"
                  placeholder="e.g. Ade Import Traders"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Country
                </span>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-medium text-slate-950 outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                >
                  <option value="">Choose country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Industry type
                </span>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_TYPES.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setIndustryType(item.label)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        industryType === item.label
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{item.emoji}</span> {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {step === 1 && (
            <Panel
              icon={Globe2}
              title="Your trade"
              text="We use this to show you better payment paths."
            >
              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Where do you buy from?
                </span>
                <div className="flex flex-wrap gap-2">
                  {TRADE_CORRIDORS.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() =>
                        toggleArr(tradeCorridors, setTradeCorridors, item.code)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        tradeCorridors.includes(item.code)
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span>{item.flag}</span> {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  What do you trade?
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_CATEGORIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        toggleArr(productCategories, setProductCategories, item)
                      }
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        productCategories.includes(item)
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Typical deal size
                </span>
                <div className="flex flex-wrap gap-2">
                  {DEAL_SIZES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDealSize(item)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        dealSize === item
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {step === 2 && (
            <Panel
              icon={CircleDollarSign}
              title="Your money"
              text="We'll show your account in the right currency."
            >
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Main currency
                </span>
                <select
                  value={mainCurrency}
                  onChange={(e) => setMainCurrency(e.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-medium text-slate-950 outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  How many suppliers do you pay regularly?
                </span>
                <div className="flex flex-wrap gap-2">
                  {SUPPLIER_COUNTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSupplierCount(item)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        supplierCount === item
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  How do you currently pay them?
                </span>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPaymentMethod(item)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        paymentMethod === item
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {step === 3 && (
            <Panel
              icon={WalletCards}
              title="Your account is ready"
              text="Here is how to fund it."
            >
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <p className="font-semibold text-white">
                  {businessName || "Your Account"}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Account address
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <code className="flex-1 truncate rounded-xl bg-white/10 px-3 py-2 text-sm font-mono text-slate-200">
                    {ACCOUNT_ADDRESS}
                  </code>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-200 transition-colors hover:bg-white/20"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-400" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <ArrowDownToLine className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Send USDC to this address</p>
                    <p className="text-sm text-slate-500">
                      From any wallet or exchange
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 opacity-50">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                    <ArrowRight className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Wire transfer coming soon</p>
                    <p className="text-sm text-slate-500">
                      Direct bank transfer
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Swap from any wallet</p>
                    <p className="text-sm text-slate-500">
                      Convert crypto from another chain
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm font-semibold text-amber-600">{error}</p>
              )}
            </Panel>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              className="h-12 px-5"
              onClick={back}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < 3 ? (
              <Button className="h-12 gap-2 px-5" onClick={next}>
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                className="h-12 gap-2 bg-emerald-600 px-5 hover:bg-emerald-700"
                onClick={finish}
                disabled={saving}
              >
                {saving ? "Opening…" : "Open my account"}
              </Button>
            )}
          </div>
        </div>

        <aside className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
          <p className="text-sm font-semibold text-emerald-300">What you get</p>
          <div className="mt-5 space-y-3">
            <SideFeature
              icon={ArrowRight}
              title="Supplier payments"
              text="Pay anyone, anywhere"
            />
            <SideFeature
              icon={CircleDollarSign}
              title="Hold dollars"
              text="Protect against local currency drops"
            />
            <SideFeature
              icon={TrendingUp}
              title="Grow idle money"
              text="Put reserves to work"
            />
            <SideFeature
              icon={Wallet}
              title="Local cash out"
              text="Convert near you (coming soon)"
            />
          </div>
        </aside>
      </section>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: typeof Building2;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Icon className="size-7" />
      </div>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-slate-500">{text}</p>
      <div className="mt-7 grid gap-5">{children}</div>
    </div>
  );
}

function SideFeature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CircleDollarSign;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-5 text-slate-300">{text}</p>
      </div>
    </div>
  );
}
