import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await d1.query(
    "SELECT * FROM agreements WHERE buyer_id = ? ORDER BY created_at DESC",
    [user.id]
  );

  return NextResponse.json({ agreements: result.results });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = `agr_${nanoid(12)}`;

  await d1.run(
    `INSERT INTO agreements (id, buyer_id, supplier_email, item, quantity, price, total, currency, delivery_window, payment_condition, raw_input, status, share_token)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
    [
      id,
      user.id,
      body.supplier_email || "",
      body.item || "Untitled",
      body.quantity || "0",
      body.price || "0",
      body.total || "0",
      body.currency || "USDC",
      body.delivery_window || "",
      body.payment_condition || "on_delivery",
      body.raw_input || "",
      nanoid(16),
    ]
  );

  await d1.run(
    "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail) VALUES (?, 'draft_created', ?, ?, 'Agreement created from pasted conversation')",
    [id, user.id, user.email]
  );

  return NextResponse.json({ id });
}
