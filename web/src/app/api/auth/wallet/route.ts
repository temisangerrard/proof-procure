import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";
import { getOrCreateWallet } from "@/lib/procure-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallet = await getOrCreateWallet(user);

  if (wallet.address) {
    await d1.run(
      "UPDATE users SET wallet_address = ? WHERE id = ? AND wallet_address IS NULL",
      [wallet.address, user.id],
    );
  }

  return NextResponse.json({
    address: wallet.address || "",
    provider: wallet.provider,
    chain: wallet.chain,
    status: wallet.status,
  });
}
