import { NextRequest, NextResponse } from "next/server";
import { d1 } from "@/lib/db";
import { sendAgreementCode } from "@/lib/email";

interface AgreementRow {
  id: string;
  supplier_email: string;
  item: string;
  status: string;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const agreement = await d1.first<AgreementRow>(
    "SELECT id, supplier_email, item, status FROM agreements WHERE share_token = ? LIMIT 1",
    [token],
  );
  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
  }
  if (agreement.status !== "awaiting_supplier") {
    return NextResponse.json(
      { error: "Agreement is not waiting for supplier review" },
      { status: 409 },
    );
  }
  if (!agreement.supplier_email) {
    return NextResponse.json(
      { error: "Supplier email is missing" },
      { status: 400 },
    );
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await d1.run(
    "INSERT INTO auth_codes (email, code, expires_at) VALUES (?, ?, ?)",
    [agreement.supplier_email.toLowerCase(), code, expiresAt],
  );
  await sendAgreementCode({
    to: agreement.supplier_email,
    code,
    item: agreement.item,
  });

  await d1.run(
    "INSERT INTO audit_events (agreement_id, event_type, actor_email, detail) VALUES (?, 'supplier_code_sent', ?, ?)",
    [agreement.id, agreement.supplier_email, "Supplier review code sent"],
  );

  return NextResponse.json({ sent: true });
}
