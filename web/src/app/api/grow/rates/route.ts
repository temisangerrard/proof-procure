import { NextResponse } from "next/server";
import { fetchYieldRates } from "@/lib/yield-rates";

export const revalidate = 300;

export async function GET() {
  try {
    const data = await fetchYieldRates();
    return NextResponse.json({ ...data, ok: true });
  } catch {
    return NextResponse.json(
      { bestApy: null, rates: [], fetchedAt: Date.now(), ok: false },
      { status: 200 },
    );
  }
}
