import { getBot } from "./bot";
import { db } from "../../db/client";

const APP_URL = process.env.APP_URL || "https://app.proofprocure.com";

const EVENT_MESSAGES: Record<string, string> = {
  PROPOSAL_READY: "A new proposal is ready for your review.",
  BUYER_RATIFIED: "The buyer has confirmed the agreement. Awaiting your confirmation.",
  SUPPLIER_RATIFIED: "The supplier has confirmed the agreement. Awaiting your confirmation.",
  DUAL_RATIFICATION_COMPLETE: "Both parties confirmed. Deploying contract.",
  CONTRACT_DEPLOYED: "Contract deployed on Base.",
  AGREEMENT_FUNDED: "Agreement funded with USDC. Awaiting delivery.",
  DELIVERY_MARKED: "Supplier marked the order as delivered. Please confirm or it will auto-release.",
  PAYMENT_RELEASED: "Payment released to supplier.",
  PAYMENT_REJECTED: "Payment rejected by buyer. Agreement paused.",
  AGREEMENT_EXPIRED: "Agreement expired.",
  REFUND_ISSUED: "Refund issued to buyer.",
  KEEPER_TIMEOUT_TRIGGERED: "Confirmation window elapsed. Payment auto-released to supplier.",
};

export async function sendTelegramNotification(
  telegramId: string,
  agreementId: string,
  eventType: string
): Promise<void> {
  const bot = getBot();

  const row = await db.query(
    `SELECT share_token, extracted_data FROM agreements WHERE id = $1`,
    [agreementId]
  );
  const agreement = row.rows[0];
  const item = agreement?.extracted_data?.item || "agreement";
  const link = agreement?.share_token
    ? `${APP_URL}/agreement/${agreement.share_token}`
    : null;

  const message = EVENT_MESSAGES[eventType] || `Status update: ${eventType}`;
  const text = [
    `${item} — ${message}`,
    link ? `\nView: ${link}` : "",
  ]
    .filter(Boolean)
    .join("");

  await bot.api.sendMessage(telegramId, text);
}
