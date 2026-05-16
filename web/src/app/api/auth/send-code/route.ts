import { NextRequest, NextResponse } from "next/server";
import { d1 } from "@/lib/db";
import { sendSignInCode } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = ((await req.json()) as Record<string, unknown>);
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    try {
      await d1.run(
        "INSERT INTO auth_codes (email, code, expires_at) VALUES (?, ?, ?)",
        [email.toLowerCase(), code, expiresAt]
      );
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
      console.log(`[DEV] OTP for ${email}: ${code}`);
      return NextResponse.json({ sent: true, devCode: code });
    }

    const sent = await sendSignInCode(email, code);
    if (!sent && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Email is not configured" }, { status: 503 });
    }

    if (!sent) {
      console.log(`[DEV] OTP for ${email}: ${code}`);
    }

    return NextResponse.json({
      sent: true,
      ...(!sent || process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("send-code error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
