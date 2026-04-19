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

  const res = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GLM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "glm-4-plus",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 512,
      temperature: 0.1,
    }),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";

  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      supplier_email: "", item: "Untitled", quantity: "0",
      price: "0", total: "0", currency: "USDC",
      delivery_window: "", payment_condition: "on_delivery", confidence: 0,
    };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      supplier_email: "", item: "Untitled", quantity: "0",
      price: "0", total: "0", currency: "USDC",
      delivery_window: "", payment_condition: "on_delivery", confidence: 0,
    };
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await d1.query(
    "SELECT * FROM agreements WHERE buyer_id = ? ORDER BY created_at DESC",
    [user.id]
  );

  return NextResponse.json({ agreements: result.results });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rawInput = body.raw_input || "";
  const id = `agr_${nanoid(12)}`;

  // Extract terms with AI if raw_input provided
  let extracted: ExtractedTerms = {
    supplier_email: "", item: "Untitled", quantity: "0",
    price: "0", total: "0", currency: "USDC",
    delivery_window: "", payment_condition: "on_delivery", confidence: 0,
  };

  if (rawInput) {
    try {
      extracted = await extractTerms(rawInput);
    } catch (err) {
      console.error("Extraction failed:", err);
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
  const payment_condition = body.payment_condition || extracted.payment_condition;

  await d1.run(
    `INSERT INTO agreements (id, buyer_id, supplier_email, item, quantity, price, total, currency, delivery_window, payment_condition, raw_input, status, share_token)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
    [id, user.id, supplier_email, item, quantity, price, total, currency, delivery_window, payment_condition, rawInput, nanoid(16)]
  );

  await d1.run(
    "INSERT INTO audit_events (agreement_id, event_type, actor_id, actor_email, detail) VALUES (?, 'draft_created', ?, ?, ?)",
    [id, user.id, user.email, extracted.confidence > 0 ? `AI extracted terms (confidence: ${extracted.confidence})` : "Agreement created"]
  );

  return NextResponse.json({
    id,
    extracted_data: extracted,
  });
}
