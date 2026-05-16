import { PiggyBank } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getActiveGrowAllocation } from "@/lib/procure-store";
import { procurementAccount } from "@/lib/procurement-demo";
import { fetchYieldRates } from "@/lib/yield-rates";
import { GrowPanel } from "./grow-panel";

export default async function GrowPage() {
  const [user, yieldRates] = await Promise.all([
    getSessionUser(),
    fetchYieldRates().catch(() => ({ bestApy: null, rates: [], fetchedAt: 0 })),
  ]);
  const allocation = user ? await getActiveGrowAllocation(user) : null;

  const allocatedAmount = allocation?.amount ?? 0;
  const safeToGrow = Math.max(
    0,
    procurementAccount.availableToAllocate - allocatedAmount,
  );

  const fmtWhole = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-sm md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/20">
              <PiggyBank className="size-4" />
              Grow
            </p>
            <p className="mt-6 text-sm font-medium text-slate-300">
              {allocation ? "Currently earning" : "Available to grow"}
            </p>
            <h1 className="mt-2 text-5xl font-semibold tracking-tight tabular-nums md:text-7xl">
              {allocation
                ? fmtWhole(allocation.amount)
                : fmtWhole(safeToGrow)}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              {allocation
                ? `Earning${yieldRates.bestApy ? ` ~${(yieldRates.bestApy * 100).toFixed(1)}% per year` : ""}. Move it back any time.`
                : "Put waiting money to work after your bills are covered."}
            </p>
          </div>
        </div>
      </section>

      <GrowPanel
        initialAllocation={allocation}
        safeToGrow={safeToGrow}
        reservedForBills={procurementAccount.reservedBalance}
        bestApy={yieldRates.bestApy}
      />
    </div>
  );
}
