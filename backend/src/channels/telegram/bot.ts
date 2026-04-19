import { Bot, Context, InlineKeyboard } from "grammy";
import { extractAgreement } from "../../extraction/pipeline";
import { db } from "../../db/client";
import { nanoid } from "nanoid";

const APP_URL = process.env.APP_URL || "https://app.proofprocure.com";

let bot: Bot | null = null;

export function getBot(): Bot {
  if (bot) return bot;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  bot = new Bot(token);
  registerHandlers(bot);
  return bot;
}

/** Strip Telegram forwarding headers and clean up text */
function normalizeMessage(text: string): string {
  return text
    .replace(/^Forwarded from .+\n?/gim, "")
    .replace(/^---------- Forwarded message ---------\n?/gim, "")
    .replace(/^From: .+\n?/gim, "")
    .replace(/^Date: .+\n?/gim, "")
    .replace(/^Subject: .+\n?/gim, "")
    .replace(/^To: .+\n?/gim, "")
    .trim();
}

async function ensureUser(ctx: Context): Promise<string> {
  const telegramId = String(ctx.from!.id);
  const existing = await db.query(
    `SELECT id FROM users WHERE telegram_id = $1`,
    [telegramId]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const result = await db.query(
    `INSERT INTO users (id, telegram_id, notification_channel, created_at)
     VALUES (gen_random_uuid(), $1, 'telegram', now())
     RETURNING id`,
    [telegramId]
  );
  return result.rows[0].id;
}

function registerHandlers(bot: Bot): void {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Send or forward a procurement conversation. I'll extract the agreement and generate a proposal."
    );
  });

  bot.on("message:text", async (ctx) => {
    const raw = ctx.message.text;
    if (raw.startsWith("/")) return;

    const normalized = normalizeMessage(raw);
    if (!normalized) {
      await ctx.reply("Empty message. Send a procurement conversation to get started.");
      return;
    }

    await ctx.reply("Extracting agreement...");

    try {
      await ensureUser(ctx);
      const result = await extractAgreement(normalized);

      if (result.state === "DRAFT") {
        const shareToken = nanoid(21);
        await db.query(
          `UPDATE agreements SET share_token = $1 WHERE id = $2`,
          [shareToken, result.id]
        );

        const d = result.extraction.data!;
        const text = [
          `Agreement extracted (${(result.extraction.confidence * 100).toFixed(0)}% confidence)`,
          "",
          `Item: ${d.item}`,
          `Qty: ${d.quantity} @ ${d.price} USDC = ${d.total} USDC`,
          `Buyer: ${d.buyer.name}`,
          `Supplier: ${d.supplier.name}`,
          `Delivery: ${d.delivery_window.start.slice(0, 10)} to ${d.delivery_window.end.slice(0, 10)}`,
          `Confirmation: ${d.confirmation_type.replace(/_/g, " ").toLowerCase()}`,
          `Expiry: ${d.expiry.slice(0, 10)}`,
        ].join("\n");

        const keyboard = new InlineKeyboard()
          .text("Confirm", `confirm:${result.id}`)
          .text("Reject", `reject:${result.id}`)
          .row()
          .url("Edit in browser", `${APP_URL}/agreement/${shareToken}`);

        await ctx.reply(text, { reply_markup: keyboard });
      } else {
        const missing = result.extraction.missing_fields.join(", ") || "various fields";
        await ctx.reply(
          `Could not extract a complete agreement. Missing: ${missing}\n\nPlease provide more details and try again.`
        );
      }
    } catch (err) {
      console.error("Telegram extraction failed:", err);
      await ctx.reply("Something went wrong processing that message. Try again.");
    }
  });

  // Callback query handlers
  bot.callbackQuery(/^confirm:(.+)$/, async (ctx) => {
    const agreementId = ctx.match![1];
    try {
      const telegramId = String(ctx.from.id);
      const user = await db.query(`SELECT id FROM users WHERE telegram_id = $1`, [telegramId]);
      if (user.rows.length === 0) {
        await ctx.answerCallbackQuery({ text: "User not found" });
        return;
      }

      await db.query(
        `UPDATE agreements SET buyer_ratified_at = now(), buyer_ratification_sig = $1, state = 'PROPOSED', updated_at = now() WHERE id = $2 AND buyer_ratified_at IS NULL`,
        [`telegram:${telegramId}`, agreementId]
      );

      await db.query(
        `INSERT INTO audit_events (id, agreement_id, event_type, actor, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'BUYER_RATIFIED', $2, '{}', now())`,
        [agreementId, `telegram:${telegramId}`]
      );

      await ctx.answerCallbackQuery({ text: "Confirmed" });
      await ctx.editMessageText(ctx.callbackQuery.message?.text + "\n\nYou confirmed this agreement. Awaiting counterparty.");
    } catch (err) {
      console.error("Confirm callback failed:", err);
      await ctx.answerCallbackQuery({ text: "Error confirming" });
    }
  });

  bot.callbackQuery(/^reject:(.+)$/, async (ctx) => {
    const agreementId = ctx.match![1];
    try {
      await db.query(
        `UPDATE agreements SET state = 'REJECTED', updated_at = now() WHERE id = $1`,
        [agreementId]
      );

      await db.query(
        `INSERT INTO audit_events (id, agreement_id, event_type, actor, metadata, created_at)
         VALUES (gen_random_uuid(), $1, 'PROPOSAL_REJECTED', $2, '{}', now())`,
        [agreementId, `telegram:${ctx.from.id}`]
      );

      await ctx.answerCallbackQuery({ text: "Rejected" });
      await ctx.editMessageText(ctx.callbackQuery.message?.text + "\n\nAgreement rejected.");
    } catch (err) {
      console.error("Reject callback failed:", err);
      await ctx.answerCallbackQuery({ text: "Error rejecting" });
    }
  });
}

export async function startTelegramBot(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[telegram] TELEGRAM_BOT_TOKEN not set — skipping bot startup");
    return;
  }
  const b = getBot();
  b.start({ onStart: () => console.log("[telegram] Bot started") });
}
