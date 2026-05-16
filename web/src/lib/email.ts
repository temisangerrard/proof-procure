import { getCloudflareContext } from "@opennextjs/cloudflare";
import { env } from "./env";

interface EmailBinding {
  send(message: {
    to: string | string[];
    from: string | { email: string; name: string };
    subject: string;
    html?: string;
    text?: string;
  }): Promise<{ messageId?: string }>;
}

async function getEmailBinding(): Promise<EmailBinding | null> {
  try {
    const context = await getCloudflareContext({ async: true });
    return ((context.env as Record<string, unknown>).EMAIL as EmailBinding | undefined) || null;
  } catch {
    return null;
  }
}

export async function sendSignInCode(to: string, code: string) {
  const from = env.PROOF_PROCURE_EMAIL_FROM;
  const subject = `${code} is your Proof Procure sign-in code`;
  const text = `Your Proof Procure sign-in code is ${code}. It expires in 10 minutes.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:32px 20px;color:#111827;">
      <p style="font-size:14px;margin:0 0 16px;color:#475569;">Proof Procure sign in</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;margin:0 0 18px;padding:18px 16px;background:#f1f5f9;border-radius:10px;text-align:center;">${code}</div>
      <p style="font-size:14px;line-height:1.5;color:#64748b;margin:0;">This code expires in 10 minutes.</p>
    </div>
  `;

  const binding = await getEmailBinding();
  if (binding) {
    await binding.send({
      to,
      from: { email: from, name: "Proof Procure" },
      subject,
      html,
      text,
    });
    return true;
  }

  const apiToken = env.CLOUDFLARE_EMAIL_API_TOKEN;
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  if (apiToken && accountId) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        from: { address: from, name: "Proof Procure" },
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare Email failed with ${response.status}`);
    }
    return true;
  }

  return false;
}
