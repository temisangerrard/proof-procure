import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await d1.query("SELECT * FROM agreements ORDER BY created_at DESC");
  return NextResponse.json({ agreements: result.results });
}
