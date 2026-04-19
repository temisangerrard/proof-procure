import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [countsResult, recentAgreements, recentUsers] = await d1.batch([
    { sql: "SELECT status, COUNT(*) as count FROM agreements GROUP BY status" },
    { sql: "SELECT * FROM agreements ORDER BY created_at DESC LIMIT 20" },
    { sql: "SELECT * FROM users ORDER BY created_at DESC LIMIT 10" },
  ]);

  const counts: Record<string, number> = {};
  for (const row of countsResult.results) {
    counts[row.status as string] = row.count as number;
  }

  return NextResponse.json({
    counts,
    recentAgreements: recentAgreements.results,
    recentUsers: recentUsers.results,
  });
}
