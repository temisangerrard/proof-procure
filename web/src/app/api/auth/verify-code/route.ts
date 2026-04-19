import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { d1 } from "@/lib/db";
import { createSessionCookie, isAdminEmail, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code required" }, { status: 400 });
  }

  const lowerEmail = email.toLowerCase();

  const result = await d1.query(
    "SELECT id, code, expires_at, used FROM auth_codes WHERE email = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1",
    [lowerEmail, code]
  );

  const entry = result.results[0];
  if (!entry) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (new Date(entry.expires_at as string) < new Date()) {
    return NextResponse.json({ error: "Code expired" }, { status: 400 });
  }

  // Mark used
  await d1.run("UPDATE auth_codes SET used = 1 WHERE id = ?", [entry.id]);

  // Upsert user
  const role = isAdminEmail(lowerEmail) ? "admin" : "user";
  const existingUser = await d1.query("SELECT id, role FROM users WHERE email = ?", [lowerEmail]);

  let userId: string;
  let userRole: string;

  if (existingUser.results.length > 0) {
    userId = existingUser.results[0].id as string;
    userRole = existingUser.results[0].role as string;
  } else {
    userId = nanoid();
    userRole = role;
    await d1.run(
      "INSERT INTO users (id, email, role) VALUES (?, ?, ?)",
      [userId, lowerEmail, role]
    );
  }

  const token = createSessionCookie({ id: userId, email: lowerEmail, role: userRole });

  const res = NextResponse.json({ verified: true, email: lowerEmail, redirect: "/app" });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}
