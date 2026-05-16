import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { saveOnboarding } from "@/lib/procure-store";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const result = await saveOnboarding(user, {
    businessName: String(body.businessName || ""),
    country: String(body.country || ""),
    industryType: String(body.industryType || ""),
    tradeCorridors: Array.isArray(body.tradeCorridors)
      ? (body.tradeCorridors as string[])
      : [],
    productCategories: Array.isArray(body.productCategories)
      ? (body.productCategories as string[])
      : [],
    dealSize: String(body.dealSize || ""),
    mainCurrency: String(body.mainCurrency || "USD"),
    supplierCount: String(body.supplierCount || ""),
    paymentMethod: String(body.paymentMethod || ""),
  });

  return NextResponse.json(result);
}
