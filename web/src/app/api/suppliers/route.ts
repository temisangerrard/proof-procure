import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupplier, listSuppliers } from "@/lib/procure-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const suppliers = await listSuppliers(user);
  return NextResponse.json({ suppliers });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const supplier = await createSupplier(user, {
    name: String(body.name || ""),
    country: String(body.country || ""),
    currency: String(body.currency || "USD"),
    phone: String(body.phone || ""),
    email: String(body.email || ""),
  });

  return NextResponse.json({ supplier }, { status: 201 });
}
