import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createCircleTransferChallenge } from "@/lib/circle-user-controlled";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const userToken = String(body.userToken || "");
  const walletId = String(body.walletId || "");
  const destinationAddress = String(body.destinationAddress || "");
  const amount = String(body.amount || "");
  const tokenAddress = String(body.tokenAddress || "");
  const billId = String(body.billId || "");

  if (!userToken || !walletId || !destinationAddress || !amount) {
    return NextResponse.json(
      { error: "Missing transfer details" },
      { status: 400 },
    );
  }

  try {
    const data = await createCircleTransferChallenge({
      userToken,
      walletId,
      destinationAddress,
      amount,
      tokenAddress,
      billId,
    });
    return NextResponse.json({ challengeId: data?.challengeId });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not start payment",
      },
      { status: 400 },
    );
  }
}
