import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/procure-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallet = await getOrCreateWallet(user);
  return NextResponse.json({ wallet });
}
