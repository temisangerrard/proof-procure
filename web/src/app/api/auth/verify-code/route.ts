import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { d1 } from "@/lib/db";
import { ensureUser, SESSION_COOKIE } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/procure-store";

const SESSION_DAYS = 30;

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const email = String(body.email || "")
    .toLowerCase()
    .trim();
  const code = String(body.code || "").trim();

  if (!email || !code) {
    return NextResponse.json(
      { error: "Email and code required" },
      { status: 400 },
    );
  }

  try {
    const authCode = await d1.first<{ id: number }>(
      `SELECT id FROM auth_codes
       WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, code],
    );

    if (!authCode) {
      return NextResponse.json(
        { error: "Wrong or expired code" },
        { status: 400 },
      );
    }

    await d1.run("UPDATE auth_codes SET used = 1 WHERE id = ?", [authCode.id]);
    const user = await ensureUser(email);
    const wallet = await getOrCreateWallet(user);
    const sessionId = nanoid(40);
    const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await d1.run(
      "INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
      [sessionId, user.id, expires.toISOString()],
    );

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires,
    });

    return NextResponse.json({ ok: true, user, wallet });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not verify code",
      },
      { status: 500 },
    );
  }
}
