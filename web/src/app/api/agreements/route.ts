import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSessionUser } from "@/lib/auth";
import { d1 } from "@/lib/db";
import { env } from "@/lib/env";

interface ExtractedTerms {
  supplier_email: string;
  item: string;
  quantity: string;
  price: string;
  total: string;
  currency: string;
  delivery_window: string;
  payment_condition: string;
  confidence: number;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface CreateAgreementRequest {
  raw_input?: string;
  supplier_email?: string;
  item?: string;
  quantity?: string;
  price?: string;
  total?: string;
  currency?: string;
  delivery_window?: string;
  payment_condition?: string;
}

const EMPTY_TERMS: ExtractedTerms = {
  supplier_email: "",
  item: "Untitled",
  quantity: "0",
  price: "0",
  total: "0",
  currency: "USDC",
  delivery_window: "",
  payment_condition: "on_delivery",
  confidence: 0,
};

function cleanNumber(value: string | undefined): string {
  return value?.replace(/,/g, "") ?? "";
}

function mergeExtractedTerms(
  primary: ExtractedTerms,
  fallback: ExtractedTerms,
): ExtractedTerms {
  return {
    supplier_email: primary.supplier_email || fallback.supplier_email,
    item:
      primary.item && primary.item !== "Untitled" ? primary.item : fallback.item,
    quantity:
      primary.quantity && primary.quantity !== "0"
        ? primary.quantity
        : fallback.quantity,
    price: primary.price && primary.price !== "0" ? primary.price : fallback.price,
    total: primary.total && primary.total !== "0" ? primary.total : fallback.total,
    currency: primary.currency || fallback.currency || "USDC",
    delivery_window: primary.delivery_window || fallback.delivery_window,
    payment_condition:
      primary.payment_condition && primary.payment_condition !== "on_delivery"
        ? primary.payment_condition
        : fallback.payment_condition,
    confidence: Math.max(primary.confidence || 0, fallback.confidence || 0),
  };
}

function extractTermsFallback(rawInput: string): ExtractedTerms {
  const text = rawInput.trim();
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const currency =
    text.match(/\b(USDC|USD|EUR|GBP|NGN|CNY|CNH|AED|TRY|INR|VND)\b/i)?.[1]?.toUpperCase() ??
    "USDC";
  const totalMatch =
    text.match(
      /(?:total|for|amount|pay|payment)\D{0,24}(?:[$€£]\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    ) ?? text.match(/(?:[$€£]\s*)([0-9][0-9,]*(?:\.[0-9]+)?)/);
  const total = cleanNumber(totalMatch?.[1]) || "0";
  const quantity =
    cleanNumber(
      text.match(/\b([0-9][0-9,]*)\s+(?:cartons?|units?|pieces?|pcs|kg|bags?|boxes?|cases?)\b/i)?.[1],
    ) || "0";
  const unitPrice =
    cleanNumber(
      text.match(/\b(?:at|unit price|price)\b\D{0,12}(?:[$€£]\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)/i)
        ?.[1],
    ) || "0";
  const delivery =
    text.match(/(?:delivery(?: date)?|deliver(?:y)? by|arrive(?:s)? by)\D{0,18}([0-9]{4}-[0-9]{2}-[0-9]{2}|[A-Z][a-z]+ \d{1,2}(?:, \d{4})?|\d{1,2}\/\d{1,2}\/\d{2,4})/i)?.[1] ??
    "";
  const paymentCondition =
    text.match(/payment terms?\s*:\s*([^.\n]+)/i)?.[1]?.trim() ??
    (/\bafter\b.*\bdelivery\b/i.test(text) ? "after delivery" : "on_delivery");

  let item = "Untitled";
  const itemMatch =
    text.match(/(?:supply|buying|buy|purchase|purchasing)\s+(.+?)(?:\s+for\s+|\s+at\s+|\.\s|$)/i) ??
    text.match(/\b([0-9][0-9,]*\s+(?:cartons?|units?|pieces?|pcs|kg|bags?|boxes?|cases?)\s+of\s+.+?)(?:\s+for\s+|\s+at\s+|\.\s|$)/i);
  if (itemMatch?.[1]) item = itemMatch[1].trim();

  const found = [email, total !== "0", item !== "Untitled", delivery].filter(Boolean).length;
  return {
    supplier_email: email,
    item,
    quantity,
    price: unitPrice,
    total,
    currency,
    delivery_window: delivery,
    payment_condition: paymentCondition,
    confidence: found >= 4 ? 0.72 : found >= 2 ? 0.45 : 0.2,
  };
}

async function extractTerms(rawInput: string): Promise<ExtractedTerms> {
  const prompt = `Extract procurement agreement terms from this conversation. Return JSON only, no markdown.

Required fields:
- supplier_email: supplier's email if mentioned, else ""
- item: what is being purchased
- quantity: number of units
- price: unit price (number only)
- total: total amount (number only)
- currency: default "USDC"
- delivery_window: delivery date or timeframe
- payment_condition: payment terms (default "on_delivery")
- confidence: 0.0-1.0 how confident you are in the extraction

If a field can't be determined, use empty string "". If confidence < 0.5, still return what you can.

Conversation:
${rawInput}`;

  const res = await fetch(
    "https://coding-intl.dashscope.aliyuncs.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.QWEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512,
        temperature: 0.1,
      }),
    },
  );

  const data = (await res.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content || "";

  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return EMPTY_TERMS;
  }

  try {
    return mergeExtractedTerms(JSON.parse(jsonMatch[0]), extractTermsFallback(rawInput));
  } catch {
    return EMPTY_TERMS;
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await d1.query(
    "SELECT * FROM agreements WHERE buyer_id = ? ORDER BY created_at DESC",
    [user.id],
  );

  return NextResponse.json({ agreements: result.results });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as CreateAgreementRequest;
  const rawInput = body.raw_input || "";
  const id = `agr_${nanoid(12)}`;

  // Extract terms with AI if raw_input provided
  let extracted: ExtractedTerms = { ...EMPTY_TERMS };

  if (rawInput) {
    const fallback = extractTermsFallback(rawInput);
    try {
      extracted = mergeExtractedTerms(await extractTerms(rawInput), fallback);
    } catch (err) {
      console.error("Extraction failed:", err);
      extracted = fallback;
    }
  }

  // Merge: AI extraction first, explicit body fields override
  const supplier_email = body.supplier_email || extracted.supplier_email;
  const item = body.item || extracted.item;
  const quantity = body.quantity || extracted.quantity;
  const price = body.price || extracted.price;
  const total = body.total || extracted.total;
  const currency = body.currency || extracted.currency;
  const delivery_window = body.delivery_window || extracted.delivery_window;
  const payment_condition =
    body.payment_condition || extracted.payment_condition;

  await d1.run(
    `INSERT INTO agreements (id, buyer_id, supplier_email, item, quantity, price, total, currency, delivery_window, payment_condition, raw_input, confidence, status, share_token)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
    [
      id,
      user.id,
      supplier_email,
      item,
      quantity,
      price,
      total,
      currency,
      delivery_window,
      payment_condition,
      rawInput,
      extracted.confidence,
      nanoid(16),
    ],
  );

  await d1.run(
    "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail) VALUES (?, 'draft_created', ?, ?, ?)",
    [
      id,
      user.id,
      user.email,
      extracted.confidence > 0
        ? `AI extracted terms (confidence: ${extracted.confidence})`
        : "Agreement created",
    ],
  );

  return NextResponse.json({
    id,
    extracted_data: extracted,
  });
}
