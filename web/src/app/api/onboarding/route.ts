import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { saveOnboarding } from "@/lib/procure-store";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const result = await saveOnboarding(user, {
    businessName: String(body.businessName || ""),
    country: String(body.country || ""),
    mainMoney: String(body.mainMoney || "USD"),
    buysFrom: String(body.buysFrom || ""),
    supplierName: String(body.supplierName || ""),
    billAmount: String(body.billAmount || ""),
    billDate: String(body.billDate || ""),
  });

  return NextResponse.json(result);
}
