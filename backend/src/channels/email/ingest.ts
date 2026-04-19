import * as nodemailer from "nodemailer";
import { createImapTransport, pollInbox } from "./imap";
import { extractAgreement } from "../../extraction/pipeline";
import { db } from "../../db/client";
import { nanoid } from "nanoid";

const APP_URL = process.env.APP_URL || "https://app.proofprocure.com";
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const POLL_INTERVAL_MS = 30_000;

let polling = false;

function getSmtpTransport(): nodemailer.Transporter {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
}

/** Strip email signatures, thread history, and forwarded headers */
function cleanEmailBody(body: string): string {
  return body
    // Forwarded headers
    .replace(/^---------- Forwarded message ---------\s*/gim, "")
    .replace(/^From: .+$/gim, "")
    .replace(/^Date: .+$/gim, "")
    .replace(/^Subject: .+$/gim, "")
    .replace(/^To: .+$/gim, "")
    .replace(/^Cc: .+$/gim, "")
    // Thread markers
    .replace(/^On .+ wrote:$/gim, "")
    .replace(/^>{1,}.+$/gm, "")
    // Common signatures
    .replace(/^--\s*$/gm, "")
    .replace(/^Sent from .+$/gim, "")
    .replace(/^Get Outlook for .+$/gim, "")
    // HTML artifacts
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function ensureUserByEmail(email: string): Promise<string> {
  const existing = await db.query(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const result = await db.query(
    `INSERT INTO users (id, email, notification_channel, created_at)
     VALUES (gen_random_uuid(), $1, 'email', now())
     RETURNING id`,
    [email]
  );
  return result.rows[0].id;
}

async function processEmail(
  senderEmail: string,
  subject: string,
  body: string
): Promise<void> {
  const cleaned = cleanEmailBody(body);
  if (!cleaned) return;

  await ensureUserByEmail(senderEmail);
  const result = await extractAgreement(cleaned);

  const smtp = getSmtpTransport();

  if (result.state === "DRAFT") {
    const shareToken = nanoid(21);
    await db.query(
      `UPDATE agreements SET share_token = $1 WHERE id = $2`,
      [shareToken, result.id]
    );

    const d = result.extraction.data!;
    const link = `${APP_URL}/agreement/${shareToken}`;

    await smtp.sendMail({
      from: GMAIL_USER,
      to: senderEmail,
      subject: `ProofProcure: Agreement extracted — ${d.item}`,
      text: [
        `Agreement extracted (${(result.extraction.confidence * 100).toFixed(0)}% confidence)`,
        "",
        `Item: ${d.item}`,
        `Qty: ${d.quantity} @ ${d.price} USDC = ${d.total} USDC`,
        `Buyer: ${d.buyer.name}`,
        `Supplier: ${d.supplier.name}`,
        "",
        `Review and confirm: ${link}`,
      ].join("\n"),
    });
  } else {
    const missing = result.extraction.missing_fields.join(", ") || "various fields";
    await smtp.sendMail({
      from: GMAIL_USER,
      to: senderEmail,
      subject: "ProofProcure: Could not extract agreement",
      text: `Could not extract a complete agreement from your message.\n\nMissing: ${missing}\n\nPlease reply with more details.`,
    });
  }
}

/** Simple IMAP polling using nodemailer's built-in capabilities */
async function pollGmail(): Promise<void> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return;

  // Use raw IMAP via node's net — but for V0, use nodemailer-compatible IMAP polling
  // We'll use the simpler approach: Gmail API via IMAP with basic auth
  const Imap = await import("node:net");

  // For V0, we use a simple fetch approach via Gmail's IMAP
  // This is a minimal implementation — production would use proper IMAP lib
  const { simpleImapFetch } = await import("./imap");
  const messages = await simpleImapFetch();

  for (const msg of messages) {
    try {
      await processEmail(msg.from, msg.subject, msg.body);
    } catch (err) {
      console.error(`[email] Failed to process message from ${msg.from}:`, err);
    }
  }
}

export async function startEmailIngestion(): Promise<void> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log("[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email ingestion");
    return;
  }

  console.log(`[email] Starting inbox poll every ${POLL_INTERVAL_MS / 1000}s for ${GMAIL_USER}`);
  polling = true;

  const tick = async () => {
    if (!polling) return;
    try {
      await pollGmail();
    } catch (err) {
      console.error("[email] Poll cycle error:", err);
    }
  };

  await tick();
  setInterval(tick, POLL_INTERVAL_MS);
}

export function stopEmailIngestion(): void {
  polling = false;
  console.log("[email] Stopped");
}

export { processEmail, cleanEmailBody };
