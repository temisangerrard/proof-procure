import { NextRequest, NextResponse } from "next/server";
import { d1 } from "@/lib/db";

interface AgreementRow {
  id: string;
  supplier_email: string;
  status: string;
}

async function consumeSupplierCode(email: string, code: string) {
  const authCode = await d1.first<{ id: number }>(
    `SELECT id FROM auth_codes
     WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
     ORDER BY created_at DESC
     LIMIT 1`,
    [email.toLowerCase(), code],
  );
  if (!authCode) return false;
  await d1.run("UPDATE auth_codes SET used = 1 WHERE id = ?", [authCode.id]);
  return true;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const code = String(body.code || "").trim();
  const changeRequest = String(body.change_request || "").trim();

  const agreement = await d1.first<AgreementRow>(
    "SELECT id, supplier_email, status FROM agreements WHERE share_token = ? LIMIT 1",
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
  if (!changeRequest) {
    return NextResponse.json(
      { error: "Tell the buyer what needs to change" },
      { status: 400 },
    );
  }
  if (!code || !(await consumeSupplierCode(agreement.supplier_email, code))) {
    return NextResponse.json(
      { error: "Wrong or expired code" },
      { status: 400 },
    );
  }

  await d1.run(
    `UPDATE agreements
     SET status = 'awaiting_buyer',
         buyer_ratified_at = NULL,
         supplier_ratified_at = NULL,
         updated_at = datetime('now')
     WHERE id = ?`,
    [agreement.id],
  );
  await d1.run(
    "INSERT INTO audit_events (agreement_id, event_type, actor_email, detail) VALUES (?, 'supplier_changes_requested', ?, ?)",
    [agreement.id, agreement.supplier_email, changeRequest],
  );

  return NextResponse.json({ ok: true, status: "awaiting_buyer" });
}
