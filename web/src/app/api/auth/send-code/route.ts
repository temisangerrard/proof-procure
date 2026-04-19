import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// In-memory OTP store (use Redis/DB in production)
const otpStore = globalThis as unknown as { __otps: Map<string, { code: string; expires: number }> };
if (!otpStore.__otps) otpStore.__otps = new Map();

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.__otps.set(email.toLowerCase(), { code, expires: Date.now() + 10 * 60 * 1000 });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "ProofProcure <onboarding@resend.dev>",
      to: email,
      subject: `${code} is your ProofProcure sign-in code`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0;">Sign in to ProofProcure</h2>
          <p style="color: #666; margin-top: 8px;">Enter this code to continue:</p>
          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0; padding: 16px; background: #f5f5f5; border-radius: 8px; text-align: center;">${code}</div>
          <p style="color: #999; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Resend error:", err);
    // Don't fail — in dev, the code is stored and can be checked in logs
    console.log(`[DEV] OTP for ${email}: ${code}`);
  }

  return NextResponse.json({ sent: true });
}
