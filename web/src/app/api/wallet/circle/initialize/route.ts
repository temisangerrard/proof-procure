import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  createCircleWalletChallenge,
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
    const data = await createCircleWalletChallenge(userToken);
    return NextResponse.json({ challengeId: data?.challengeId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not initialize wallet";
    if (message.includes("155106")) {
      const wallets = await listCircleWallets(userToken);
      const first = wallets[0];
      if (first) {
        await recordCircleWallet(user, {
          providerUserId: first.userId,
          providerWalletId: first.id,
          address: first.address,
          chain: first.blockchain,
          status: first.state?.toLowerCase() || "ready",
        });
      }
      return NextResponse.json({ wallets });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
