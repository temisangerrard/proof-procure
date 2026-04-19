import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deriveWalletFromEmail } from "@/lib/wallet";
import { d1 } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { address } = deriveWalletFromEmail(user.email);

  // Store if not already set
  await d1.run(
    "UPDATE users SET wallet_address = ? WHERE id = ? AND wallet_address IS NULL",
    [address, user.id]
  );

  return NextResponse.json({ address });
}
