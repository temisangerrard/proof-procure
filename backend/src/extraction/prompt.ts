export const EXTRACTION_SYSTEM_PROMPT = `You are a procurement agreement extraction engine. Your job is to extract structured agreement data from unstructured procurement conversations, emails, or messages.

You MUST output valid JSON matching this exact schema — no markdown, no explanation, no wrapping:

{
  "data": {
    "buyer": { "name": string, "email": string | null, "telegram_id": string | null },
    "supplier": { "name": string, "email": string | null, "telegram_id": string | null },
    "item": string,
    "quantity": number,
    "price": number,
    "total": number,
    "currency": "USDC",
    "delivery_window": { "start": ISO8601, "end": ISO8601 },
    "confirmation_type": "BUYER_CONFIRMATION" | "SHIPPING_CONFIRMATION" | "RECEIPT_UPLOAD",
    "confirmation_window": number (seconds),
    "payment_condition": string,
    "expiry": ISO8601
  },
  "confidence": number (0.0 to 1.0),
  "missing_fields": string[],
  "warnings": string[]
}

RULES:
1. currency is ALWAYS "USDC". If the conversation mentions another currency, convert the concept but note it in warnings.
2. total MUST equal quantity * price. Calculate it yourself.
3. If a field cannot be determined from the input, set it to null in data and add the field name to missing_fields.
4. If ANY of these required fields are missing, set confidence below 0.5: buyer, supplier, item, quantity, price.
5. confirmation_type defaults to "BUYER_CONFIRMATION" if not specified.
6. confirmation_window defaults to 259200 (3 days in seconds) if not specified.
7. If delivery dates are vague (e.g. "next week"), estimate reasonable ISO8601 dates and add a warning.
8. payment_condition should describe when payment releases (e.g. "Release on buyer confirmation or 3-day timeout after delivery").
9. expiry should be set to 30 days after delivery_window.end if not explicitly stated.
10. Output ONLY the JSON object. No preamble, no markdown fences, no trailing text.`;

export const EXTRACTION_FEW_SHOT_EXAMPLES = [
  {
    role: "user" as const,
    content: `Extract the agreement from this conversation:

"Hey Mike, we need 500 units of the industrial gaskets we discussed. $12 each, delivered by end of March. Same terms as last time — I'll confirm delivery and you get paid. Let me know if that works.

— Sarah Chen, Apex Manufacturing"

"Sarah, sounds good. 500 gaskets at $12, delivery by March 31. I'll ship from our Houston warehouse. Give me a week heads up if anything changes.

— Mike Torres, Torres Industrial Supply"`,
  },
  {
    role: "assistant" as const,
    content: JSON.stringify({
      data: {
        buyer: {
          name: "Sarah Chen, Apex Manufacturing",
          email: null,
          telegram_id: null,
        },
        supplier: {
          name: "Mike Torres, Torres Industrial Supply",
          email: null,
          telegram_id: null,
        },
        item: "Industrial gaskets",
        quantity: 500,
        price: 12,
        total: 6000,
        currency: "USDC",
        delivery_window: {
          start: "2026-03-01T00:00:00Z",
          end: "2026-03-31T23:59:59Z",
        },
        confirmation_type: "BUYER_CONFIRMATION",
        confirmation_window: 259200,
        payment_condition:
          "Release on buyer confirmation or 3-day timeout after delivery",
        expiry: "2026-04-30T23:59:59Z",
      },
      confidence: 0.85,
      missing_fields: [],
      warnings: [
        "Price assumed to be in USDC equivalent (original currency: USD)",
        "Delivery start date estimated as March 1 based on context",
      ],
    }),
  },
  {
    role: "user" as const,
    content: `Extract the agreement from this conversation:

"need 50 boxes of copy paper asap"`,
  },
  {
    role: "assistant" as const,
    content: JSON.stringify({
      data: {
        buyer: { name: null, email: null, telegram_id: null },
        supplier: { name: null, email: null, telegram_id: null },
        item: "Copy paper",
        quantity: 50,
        price: null,
        total: null,
        currency: "USDC",
        delivery_window: null,
        confirmation_type: "BUYER_CONFIRMATION",
        confirmation_window: 259200,
        payment_condition: null,
        expiry: null,
      },
      confidence: 0.2,
      missing_fields: [
        "buyer",
        "supplier",
        "price",
        "total",
        "delivery_window",
        "payment_condition",
        "expiry",
      ],
      warnings: [
        "Buyer identity unknown — only a message fragment provided",
        "No supplier identified",
        "No price specified",
        "No delivery timeline specified",
      ],
    }),
  },
];
