import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { withdrawGrowAllocation } from "@/lib/procure-store";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { allocationId?: string };
  if (!body.allocationId) {
    return NextResponse.json({ error: "allocationId required" }, { status: 400 });
  }

  try {
    const allocation = await withdrawGrowAllocation(user, body.allocationId);
    return NextResponse.json({ allocation });
  } catch {
    return NextResponse.json({ error: "Allocation not found" }, { status: 404 });
  }
}
