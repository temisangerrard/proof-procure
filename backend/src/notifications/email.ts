import * as nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const APP_URL = process.env.APP_URL || "https://app.proofprocure.com";

const EVENT_SUBJECTS: Record<string, string> = {
  PROPOSAL_READY: "New proposal ready for review",
  BUYER_RATIFIED: "Buyer confirmed — your turn",
  SUPPLIER_RATIFIED: "Supplier confirmed — your turn",
  DUAL_RATIFICATION_COMPLETE: "Both parties confirmed — deploying",
  CONTRACT_DEPLOYED: "Contract deployed",
  AGREEMENT_FUNDED: "Agreement funded",
  DELIVERY_MARKED: "Delivery marked — please confirm",
  PAYMENT_RELEASED: "Payment released",
  PAYMENT_REJECTED: "Payment rejected",
  AGREEMENT_EXPIRED: "Agreement expired",
  REFUND_ISSUED: "Refund issued",
  KEEPER_TIMEOUT_TRIGGERED: "Payment auto-released (timeout)",
};

export async function sendEmailNotification(
  to: string,
  agreementId: string,
  eventType: string,
  extractedData?: Record<string, unknown> | null
): Promise<void> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return;

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  const item = (extractedData?.item as string) || "Agreement";
  const subject = `ProofProcure: ${item} — ${EVENT_SUBJECTS[eventType] || eventType}`;
  const body = `${EVENT_SUBJECTS[eventType] || `Status update: ${eventType}`}\n\nView details: ${APP_URL}/agreement/${agreementId}`;

  await transport.sendMail({
    from: GMAIL_USER,
    to,
    subject,
    text: body,
  });
}
