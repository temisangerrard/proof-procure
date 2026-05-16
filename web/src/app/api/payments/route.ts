import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { markPaymentPaid, payBill } from "@/lib/procure-store";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const billId = String(body.billId || "");
  if (!billId)
    return NextResponse.json({ error: "Missing billId" }, { status: 400 });

  try {
    const payment = await payBill(user, billId);
    return NextResponse.json({ payment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const paymentId = String(body.paymentId || "");
  const txHash = String(body.txHash || "");

  try {
    const payment = await markPaymentPaid(user, { paymentId, txHash });
    return NextResponse.json({ payment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment update failed" },
      { status: 400 },
    );
  }
}
