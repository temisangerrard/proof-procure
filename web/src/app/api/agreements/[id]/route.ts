import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";
import { sendAgreementReviewLink } from "@/lib/email";

type AgreementPatch = Partial<
  Record<
    | "item"
    | "quantity"
    | "price"
    | "total"
    | "supplier_email"
    | "currency"
    | "delivery_window"
    | "payment_condition",
    string
  >
>;

interface AgreementRow {
  id: string;
  buyer_id: string;
  supplier_email: string;
  item: string;
  quantity: string;
  price: string;
  total: string;
  currency: string;
  delivery_window: string | null;
  payment_condition: string;
  status: string;
  share_token: string | null;
  confidence: number | null;
  created_at: string;
}

type AgreementAction = { action?: "send_to_supplier" };

const EDITABLE_STATUSES = new Set(["draft", "awaiting_buyer"]);

function missingRequiredFields(agreement: AgreementRow): string[] {
  const missing: string[] = [];
  if (!agreement.supplier_email?.trim()) missing.push("supplier email");
  if (!agreement.item?.trim()) missing.push("item");
  if (!Number(agreement.total)) missing.push("total amount");
  if (!agreement.currency?.trim()) missing.push("currency");
  if (!agreement.delivery_window?.trim()) missing.push("delivery");
  if (!agreement.payment_condition?.trim()) missing.push("payment terms");
  return missing;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await d1.query<AgreementRow>(
    "SELECT * FROM agreements WHERE id = ?",
    [id],
  );
  if (!result.results.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (result.results[0].buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await d1.query(
    "SELECT * FROM audit_events WHERE agreement_id = ? ORDER BY created_at ASC",
    [id],
  );

  return NextResponse.json({
    agreement: result.results[0],
    events: events.results,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as AgreementPatch;
  const agreement = await d1.first<AgreementRow>(
    "SELECT * FROM agreements WHERE id = ?",
    [id],
  );
  if (!agreement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (agreement.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!EDITABLE_STATUSES.has(agreement.status)) {
    return NextResponse.json(
      { error: "Agreement is locked and cannot be edited" },
      { status: 409 },
    );
  }

  const allowed = [
    "item",
    "quantity",
    "price",
    "total",
    "supplier_email",
    "currency",
    "delivery_window",
    "payment_condition",
  ];
  const sets: string[] = [];
  const vals: unknown[] = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      sets.push(`${key} = ?`);
      vals.push(body[key]);
    }
  }

  if (!sets.length)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  sets.push("buyer_ratified_at = NULL");
  sets.push("supplier_ratified_at = NULL");
  if (agreement.status === "awaiting_buyer") {
    sets.push("status = 'draft'");
  }
  sets.push("updated_at = datetime('now')");
  vals.push(id);

  await d1.run(`UPDATE agreements SET ${sets.join(", ")} WHERE id = ?`, vals);

  await d1.run(
    "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail) VALUES (?, 'terms_revised', ?, ?, ?)",
    [id, user.id, user.email, "Agreement terms updated by buyer"],
  );

  return NextResponse.json({ updated: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as AgreementAction;
  if (body.action !== "send_to_supplier") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const agreement = await d1.first<AgreementRow>(
    "SELECT * FROM agreements WHERE id = ?",
    [id],
  );
  if (!agreement) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (agreement.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!EDITABLE_STATUSES.has(agreement.status)) {
    return NextResponse.json(
      { error: "Only editable agreements can be sent" },
      { status: 409 },
    );
  }

  const missing = missingRequiredFields(agreement);
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const shareToken = agreement.share_token || nanoid(16);
  await d1.run(
    `UPDATE agreements
     SET status = 'awaiting_supplier',
         share_token = ?,
         buyer_ratified_at = datetime('now'),
         supplier_ratified_at = NULL,
         updated_at = datetime('now')
     WHERE id = ?`,
    [shareToken, id],
  );

  const shareUrl = `${req.nextUrl.origin}/agreement/${shareToken}`;
  await sendAgreementReviewLink({
    to: agreement.supplier_email,
    item: agreement.item,
    url: shareUrl,
  });

  await d1.run(
    "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail) VALUES (?, 'status_awaiting_supplier', ?, ?, ?)",
    [id, user.id, user.email, `Sent to supplier: ${shareUrl}`],
  );

  return NextResponse.json({
    ok: true,
    status: "awaiting_supplier",
    share_token: shareToken,
    share_url: shareUrl,
  });
}
