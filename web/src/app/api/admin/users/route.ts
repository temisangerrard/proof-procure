import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await d1.query(
    `SELECT u.*, COUNT(a.id) as agreement_count
     FROM users u LEFT JOIN agreements a ON a.buyer_id = u.id
     GROUP BY u.id ORDER BY u.created_at DESC`
  );

  return NextResponse.json({ users: result.results });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, role } = ((await req.json()) as any);
  if (!userId || !["admin", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  await d1.run("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?", [role, userId]);
  return NextResponse.json({ updated: true });
}
