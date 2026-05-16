import { NextResponse } from "next/server";
import { getArcChainId } from "@/lib/arc";

export async function GET() {
  const chain = await getArcChainId();
  return NextResponse.json(chain);
}
