import { db } from "../db/client";
import { sendTelegramNotification } from "../channels/telegram/notifications";
import { sendEmailNotification } from "./email";

/**
 * Central notification dispatcher.
 * Called after every state transition — routes to the correct channel
 * based on user preference (telegram or email).
 */
export async function notifyAgreementUpdate(
  agreementId: string,
  eventType: string
): Promise<void> {
  const result = await db.query(
    `SELECT
       a.id, a.extracted_data, a.share_token,
       b.id AS buyer_user_id, b.email AS buyer_email, b.telegram_id AS buyer_telegram_id, b.notification_channel AS buyer_channel,
       s.id AS supplier_user_id, s.email AS supplier_email, s.telegram_id AS supplier_telegram_id, s.notification_channel AS supplier_channel
     FROM agreements a
     LEFT JOIN users b ON a.buyer_id = b.id
     LEFT JOIN users s ON a.supplier_id = s.id
     WHERE a.id = $1`,
    [agreementId]
  );

  if (result.rows.length === 0) return;
  const row = result.rows[0];

  // Determine who to notify based on event type
  const targets = getNotificationTargets(eventType, row);

  for (const target of targets) {
    try {
      if (target.channel === "telegram" && target.telegramId) {
        await sendTelegramNotification(target.telegramId, agreementId, eventType);
      } else if (target.email) {
        await sendEmailNotification(target.email, agreementId, eventType, row.extracted_data);
      }
    } catch (err) {
      console.error(`[notify] Failed to notify ${target.email || target.telegramId} for ${eventType}:`, err);
    }
  }
}

interface NotifyTarget {
  channel: string;
  email?: string;
  telegramId?: string;
}

function getNotificationTargets(
  eventType: string,
  row: Record<string, unknown>
): NotifyTarget[] {
  const buyer: NotifyTarget = {
    channel: (row.buyer_channel as string) || "email",
    email: row.buyer_email as string | undefined,
    telegramId: row.buyer_telegram_id as string | undefined,
  };
  const supplier: NotifyTarget = {
    channel: (row.supplier_channel as string) || "email",
    email: row.supplier_email as string | undefined,
    telegramId: row.supplier_telegram_id as string | undefined,
  };

  // Route based on event type
  switch (eventType) {
    case "BUYER_RATIFIED":
      return [supplier];
    case "SUPPLIER_RATIFIED":
      return [buyer];
    case "DELIVERY_MARKED":
      return [buyer];
    case "AGREEMENT_FUNDED":
      return [supplier];
    default:
      // Both parties for: deployment, payment, expiry, refund
      return [buyer, supplier].filter((t) => t.email || t.telegramId);
  }
}
