import { NextRequest, NextResponse } from "next/server";

const otpStore = globalThis as unknown as { __otps: Map<string, { code: string; expires: number }> };
if (!otpStore.__otps) otpStore.__otps = new Map();

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code required" }, { status: 400 });
  }

  const entry = otpStore.__otps.get(email.toLowerCase());
  if (!entry) {
    return NextResponse.json({ error: "No code found. Please request a new one." }, { status: 400 });
  }

  if (Date.now() > entry.expires) {
    otpStore.__otps.delete(email.toLowerCase());
    return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 });
  }

  if (entry.code !== code) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  otpStore.__otps.delete(email.toLowerCase());
  return NextResponse.json({ verified: true, email });
}
