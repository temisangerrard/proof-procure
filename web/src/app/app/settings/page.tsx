import { Building2, Globe2, Landmark, Settings2 } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { CircleWalletSetup } from "./circle-wallet-setup";

const PROFILE = [
  { label: "Company", value: "Adebayo Trading Ltd.", icon: Building2 },
  { label: "Main market", value: "UK import business", icon: Landmark },
  {
    label: "Supplier countries",
    value: "China, Turkey, India, Vietnam",
    icon: Globe2,
  },
  { label: "Monthly procurement", value: "$120,000 average", icon: Settings2 },
];

export default async function SettingsPage() {
  const user = await getSessionUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">More</h1>
        <p className="mt-1 text-sm text-slate-500">Business details.</p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold">Profile</h2>
          <p className="mt-1 text-sm text-slate-500">Used for reminders.</p>
        </div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2">
          {PROFILE.map((item) => (
            <div key={item.label} className="bg-white p-5">
              <item.icon className="size-5 text-slate-400" />
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <CircleWalletSetup email={user?.email} />

      <div className="rounded-2xl bg-slate-950 p-5 text-white">
        <p className="text-sm font-medium text-emerald-300">
          Behind the scenes
        </p>
        <h2 className="mt-2 text-xl font-semibold">
          Simple outside. Fast inside.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Operators handle the rails.
        </p>
      </div>
    </div>
  );
}
