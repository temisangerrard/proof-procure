import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  getCircleWalletBalances,
  listCircleWallets,
} from "@/lib/circle-user-controlled";
import { recordCircleWallet } from "@/lib/procure-store";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const userToken = String(body.userToken || "");
  if (!userToken)
    return NextResponse.json({ error: "Missing userToken" }, { status: 400 });

  try {
    const wallets = await listCircleWallets(userToken);
    const first = wallets[0];
    let balances = [];

    if (first) {
      await recordCircleWallet(user, {
        providerUserId: first.userId,
        providerWalletId: first.id,
        address: first.address,
        chain: first.blockchain,
        status: first.state?.toLowerCase() || "ready",
      });
      balances = await getCircleWalletBalances({
        userToken,
        walletId: first.id,
      });
    }

    return NextResponse.json({ wallets, balances });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load wallets",
      },
      { status: 400 },
    );
  }
}
