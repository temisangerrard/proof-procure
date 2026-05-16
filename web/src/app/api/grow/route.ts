import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getActiveGrowAllocation,
  createGrowAllocation,
} from "@/lib/procure-store";
import { procurementAccount } from "@/lib/procurement-demo";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allocation = await getActiveGrowAllocation(user);
  const allocatedAmount = allocation?.amount ?? 0;
  const safeToGrow = Math.max(0, procurementAccount.availableToAllocate - allocatedAmount);

  return NextResponse.json({
    allocation,
    safeToGrow,
    availableToAllocate: procurementAccount.availableToAllocate,
    reservedForBills: procurementAccount.reservedBalance,
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { amount?: number };
  const amount = Number(body.amount);

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
  }

  const existing = await getActiveGrowAllocation(user);
  if (existing) {
    return NextResponse.json(
      { error: "You already have an active Grow position. Withdraw it first." },
      { status: 400 },
    );
  }

  const safeToGrow = procurementAccount.availableToAllocate;
  if (amount > safeToGrow) {
    return NextResponse.json(
      {
        error: `You can put up to ${safeToGrow} into Grow — your bills need the rest reserved`,
        safeToGrow,
      },
      { status: 400 },
    );
  }

  const allocation = await createGrowAllocation(user, amount);
  return NextResponse.json({ allocation });
}
