import { z } from "zod";

export const PartySchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  telegram_id: z.string().optional(),
});

export const ConfirmationType = z.enum([
  "BUYER_CONFIRMATION",
  "SHIPPING_CONFIRMATION",
  "RECEIPT_UPLOAD",
]);

export const AgreementDataSchema = z
  .object({
    buyer: PartySchema,
    supplier: PartySchema,
    item: z.string().min(1),
    quantity: z.number().positive(),
    price: z.number().positive(),
    total: z.number().positive(),
    currency: z.literal("USDC"),
    delivery_window: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    confirmation_type: ConfirmationType,
    confirmation_window: z
      .number()
      .int()
      .positive()
      .describe("Duration in seconds"),
    payment_condition: z.string().min(1),
    expiry: z.string().datetime(),
  })
  .refine((d) => d.total === d.quantity * d.price, {
    message: "total must equal quantity * price",
    path: ["total"],
  });

export type AgreementData = z.infer<typeof AgreementDataSchema>;
export type Party = z.infer<typeof PartySchema>;

export interface ExtractionResult {
  data: AgreementData | null;
  confidence: number;
  missing_fields: string[];
  warnings: string[];
}

export const CONFIDENCE_THRESHOLD = parseFloat(
  process.env.CONFIDENCE_THRESHOLD || "0.7"
);
