const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface AgreementResponse {
  id: string;
  state: string;
  extracted_data: {
    buyer: { name: string; email?: string; telegram_id?: string };
    supplier: { name: string; email?: string; telegram_id?: string };
    item: string;
    quantity: number;
    price: number;
    total: number;
    currency: string;
    delivery_window: { start: string; end: string };
    confirmation_type: string;
    confirmation_window: number;
    payment_condition: string;
    expiry: string;
  } | null;
  confidence_score: number;
  share_token: string | null;
  share_url: string | null;
  buyer_ratified_at: string | null;
  supplier_ratified_at: string | null;
  created_at: string;
}

export async function fetchAgreement(
  token: string
): Promise<AgreementResponse> {
  const res = await fetch(`${API}/api/agreements/${token}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Agreement not found (${res.status})`);
  return res.json();
}

export async function patchAgreement(
  token: string,
  fields: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(`${API}/api/agreements/${token}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Update failed (${res.status})`);
  return res.json();
}
