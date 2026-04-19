import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { d1 } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await d1.run(
    "INSERT INTO auth_codes (email, code, expires_at) VALUES (?, ?, ?)",
    [email.toLowerCase(), code, expiresAt]
  );

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      await transporter.sendMail({
        from: `ProofProcure <${gmailUser}>`,
        to: email,
        subject: `${code} is your ProofProcure sign-in code`,
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:40px 20px;">
            <h2 style="font-size:20px;font-weight:600;margin:0;">Sign in to ProofProcure</h2>
            <p style="color:#666;margin-top:8px;">Enter this code to continue:</p>
            <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0;padding:16px;background:#f5f5f5;border-radius:8px;text-align:center;">${code}</div>
            <p style="color:#999;font-size:13px;">This code expires in 10 minutes.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Gmail send error:", err);
      // Still return success — code is in DB, log it for dev
      console.log(`[DEV FALLBACK] OTP for ${email}: ${code}`);
    }
  } else {
    console.log(`[DEV] OTP for ${email}: ${code}`);
  }

  return NextResponse.json({ sent: true });
}
