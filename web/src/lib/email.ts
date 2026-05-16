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

export async function sendAgreementCode(input: {
  to: string;
  code: string;
  item: string;
}): Promise<boolean> {
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) return false;

  const from = env.RESEND_FROM;
  const subject = `${input.code} is your Proof Procure agreement code`;
  const text = `Use ${input.code} to review the agreement for ${input.item || "this supplier payment"}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:32px 20px;color:#111827;">
      <p style="font-size:14px;margin:0 0 16px;color:#475569;">Proof Procure agreement review</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;margin:0 0 18px;padding:18px 16px;background:#f1f5f9;border-radius:10px;text-align:center;">${input.code}</div>
      <p style="font-size:14px;line-height:1.5;color:#64748b;margin:0;">Use this code to confirm or ask for changes. It expires in 10 minutes.</p>
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
      to: input.to,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend agreement code error ${res.status}: ${body}`);
    return false;
  }

  return true;
}

export async function sendAgreementReviewLink(input: {
  to: string;
  item: string;
  url: string;
}): Promise<boolean> {
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) return false;

  const from = env.RESEND_FROM;
  const subject = `Review supplier agreement: ${input.item || "Proof Procure"}`;
  const text = `Review this agreement: ${input.url}`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;color:#111827;">
      <p style="font-size:14px;margin:0 0 16px;color:#475569;">Proof Procure agreement review</p>
      <h1 style="font-size:22px;margin:0 0 12px;">Review the payment terms</h1>
      <p style="font-size:14px;line-height:1.5;color:#64748b;margin:0 0 20px;">Please review the supplier payment terms for ${input.item || "this order"}.</p>
      <a href="${input.url}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;font-weight:700;padding:12px 16px;border-radius:10px;">Open agreement</a>
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
      to: input.to,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend agreement link error ${res.status}: ${body}`);
    return false;
  }

  return true;
}
