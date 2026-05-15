import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createBill, listBills } from "@/lib/procure-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bills = await listBills(user);
  return NextResponse.json({ bills });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const bill = await createBill(user, {
    supplierId: String(body.supplierId || ""),
    title: String(body.title || "Supplier payment"),
    amount: Number(body.amount || 0),
    currency: String(body.currency || "USD"),
    dueDate: String(body.dueDate || ""),
    note: String(body.note || ""),
  });

  return NextResponse.json({ bill }, { status: 201 });
}
