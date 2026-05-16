import { NextRequest, NextResponse } from "next/server";
import { d1 } from "@/lib/db";

interface PublicAgreementRow {
  id: string;
  supplier_email: string;
  item: string;
  quantity: string;
  price: string;
  total: string;
  currency: string;
  delivery_window: string | null;
  payment_condition: string;
  status: string;
  confidence: number | null;
  buyer_ratified_at: string | null;
  supplier_ratified_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const agreement = await d1.first<PublicAgreementRow>(
    `SELECT id, supplier_email, item, quantity, price, total, currency,
            delivery_window, payment_condition, status, confidence,
            buyer_ratified_at, supplier_ratified_at, created_at, updated_at
     FROM agreements
     WHERE share_token = ?
     LIMIT 1`,
    [token],
  );

  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }

  return NextResponse.json({ agreement });
}
