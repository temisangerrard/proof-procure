import { env } from "./env";

export async function sendSignInCode(
  to: string,
  code: string,
): Promise<boolean> {
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) return false;

  const from = env.RESEND_FROM;
  const subject = `${code} is your Proof Procure sign-in code`;
  const text = `Your sign-in code is ${code}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:32px 20px;color:#111827;">
      <p style="font-size:14px;margin:0 0 16px;color:#475569;">Proof Procure sign in</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;margin:0 0 18px;padding:18px 16px;background:#f1f5f9;border-radius:10px;text-align:center;">${code}</div>
      <p style="font-size:14px;line-height:1.5;color:#64748b;margin:0;">This code expires in 10 minutes.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Proof Procure <${from}>`,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }

  return true;
}
