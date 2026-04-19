import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await d1.query("SELECT * FROM agreements WHERE id = ?", [id]);
  if (!result.results.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const events = await d1.query(
    "SELECT * FROM audit_events WHERE agreement_id = ? ORDER BY created_at ASC",
    [id]
  );

  return NextResponse.json({ agreement: result.results[0], events: events.results });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ["status", "item", "quantity", "price", "total", "supplier_email", "delivery_window", "payment_condition"];
  const sets: string[] = [];
  const vals: unknown[] = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      sets.push(`${key} = ?`);
      vals.push(body[key]);
    }
  }

  if (!sets.length) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  sets.push("updated_at = datetime('now')");
  vals.push(id);

  await d1.run(`UPDATE agreements SET ${sets.join(", ")} WHERE id = ?`, vals);

  if (body.status) {
    await d1.run(
      "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail) VALUES (?, ?, ?, ?, ?)",
      [id, `status_${body.status}`, user.id, user.email, `Status changed to ${body.status}`]
    );
  }

  return NextResponse.json({ updated: true });
}
