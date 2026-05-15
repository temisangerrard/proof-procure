"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Globe2,
  MapPin,
  ShieldCheck,
  UserPlus,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COUNTRIES = ["China", "Vietnam", "India", "Turkey", "UAE", "Europe", "United States", "Nigeria"];
const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "AED", "CNY"];

type Step = 0 | 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    country: "",
    mainMoney: "USD",
    buysFrom: "China",
    supplierName: "",
    billAmount: "",
    billDate: "",
  });

  const completion = useMemo(() => ((step + 1) / 4) * 100, [step]);

  function update(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function next() {
    setStep((current) => Math.min(current + 1, 3) as Step);
  }

  function back() {
    setStep((current) => Math.max(current - 1, 0) as Step);
  }

  async function finish() {
    setSaving(true);
    window.localStorage.setItem("proofProcureOnboarding", JSON.stringify({ ...form, doneAt: new Date().toISOString() }));
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/app");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Set up your account</h1>
          <p className="mt-1 text-sm text-slate-500">We need a few details before your first payment.</p>
        </div>
        <Button variant="ghost" onClick={() => router.push("/app")}>
          Skip
        </Button>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${completion}%` }} />
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-7">
          {step === 0 && (
            <Panel
              icon={Building2}
              title="Your business"
              text="This name appears on your account."
            >
              <Field label="Business name">
                <Input
                  className="h-14 rounded-2xl px-4 text-lg"
                  placeholder="Example: Ade Import Traders"
                  value={form.businessName}
                  onChange={(event) => update("businessName", event.target.value)}
                />
              </Field>
              <Field label="Where are you based?">
                <Select value={form.country} onChange={(value) => update("country", value)} placeholder="Choose country">
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </Select>
              </Field>
            </Panel>
          )}

          {step === 1 && (
            <Panel
              icon={Globe2}
              title="Your trade"
              text="This helps the app show the right payment path."
            >
              <Field label="Where do you buy from most?">
                <Select value={form.buysFrom} onChange={(value) => update("buysFrom", value)}>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Main money">
                <Select value={form.mainMoney} onChange={(value) => update("mainMoney", value)}>
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </Select>
              </Field>
            </Panel>
          )}

          {step === 2 && (
            <Panel
              icon={UserPlus}
              title="First supplier"
              text="Add one person or company you pay."
            >
              <Field label="Supplier name">
                <Input
                  className="h-14 rounded-2xl px-4 text-lg"
                  placeholder="Example: Mei Lin Trading"
                  value={form.supplierName}
                  onChange={(event) => update("supplierName", event.target.value)}
                />
              </Field>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                You can add phone, email, and payout details later.
              </div>
            </Panel>
          )}

          {step === 3 && (
            <Panel
              icon={WalletCards}
              title="First bill"
              text="Add one payment you need to make."
            >
              <Field label="Amount">
                <Input
                  className="h-14 rounded-2xl px-4 text-lg"
                  inputMode="decimal"
                  placeholder="18200"
                  value={form.billAmount}
                  onChange={(event) => update("billAmount", event.target.value)}
                />
              </Field>
              <Field label="Pay date">
                <Input
                  className="h-14 rounded-2xl px-4 text-lg"
                  type="date"
                  value={form.billDate}
                  onChange={(event) => update("billDate", event.target.value)}
                />
              </Field>
            </Panel>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" className="h-12 px-5" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {step < 3 ? (
              <Button className="h-12 gap-2 px-5" onClick={next}>
                Next <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button className="h-12 gap-2 bg-emerald-600 px-5 hover:bg-emerald-700" onClick={finish} disabled={saving}>
                {saving ? "Saving" : "Open my account"} <CheckCircle2 className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <aside className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
          <p className="text-sm font-semibold text-emerald-300">What happens next</p>
          <div className="mt-5 space-y-3">
            <SideStep icon={CircleDollarSign} title="Add money" text="Your account shows a dollar balance." />
            <SideStep icon={ShieldCheck} title="See Ready or Short" text="The app tells you if a bill can be paid." />
            <SideStep icon={Banknote} title="Pay supplier" text="Check once, then send." />
            <SideStep icon={MapPin} title="Track result" text="The bill changes to Paid." />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-medium text-slate-950 outline-none transition-colors focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

function SideStep({
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
