import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { d1 } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    try {
      await d1.run("DELETE FROM auth_sessions WHERE id = ?", [sessionId]);
    } catch {
      // Best-effort cleanup; clearing the cookie is what signs the browser out.
    }
  }

  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
