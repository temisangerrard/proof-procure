import { NextRequest, NextResponse } from "next/server";
import { d1 } from "@/lib/db";

interface AgreementRow {
  id: string;
  supplier_email: string;
  status: string;
  buyer_ratified_at: string | null;
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
  const agreement = await d1.first<AgreementRow>(
    "SELECT id, supplier_email, status, buyer_ratified_at FROM agreements WHERE share_token = ? LIMIT 1",
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
  if (!code || !(await consumeSupplierCode(agreement.supplier_email, code))) {
    return NextResponse.json(
      { error: "Wrong or expired code" },
      { status: 400 },
    );
  }

  const nextStatus = agreement.buyer_ratified_at
    ? "ratified"
    : "awaiting_buyer";
  await d1.run(
    `UPDATE agreements
     SET supplier_ratified_at = datetime('now'),
         status = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [nextStatus, agreement.id],
  );

  await d1.run(
    "INSERT INTO audit_events (agreement_id, event_type, actor_email, detail) VALUES (?, 'supplier_confirmed', ?, ?)",
    [
      agreement.id,
      agreement.supplier_email,
      nextStatus === "ratified"
        ? "Supplier confirmed terms. Agreement ratified."
        : "Supplier confirmed terms.",
    ],
  );
  if (nextStatus === "ratified") {
    await d1.run(
      "INSERT INTO audit_events (agreement_id, event_type, actor_email, detail) VALUES (?, 'status_ratified', 'system', 'Both sides confirmed the same terms')",
      [agreement.id],
    );
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
