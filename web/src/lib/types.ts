export type AgreementStatus =
  | "DRAFT"
  | "PROPOSED"
  | "RATIFIED"
  | "DEPLOYED"
  | "FUNDED"
  | "DELIVERED_PENDING_CONFIRMATION"
  | "COMPLETED"
  | "EXPIRED";

export interface Agreement {
  id: string;
  state: AgreementStatus;
  counterparty: string;
  counterparty_role: "buyer" | "supplier";
  item: string;
  sku?: string;
  quantity: number;
  price: number;
  currency: string;
  total: number;
  delivery_window: { start: string; end: string };
  payment_rule: string;
  created_at: string;
  updated_at?: string;
  buyer: { name: string; email?: string };
  supplier: { name: string; email?: string };
  buyer_ratified_at?: string | null;
  supplier_ratified_at?: string | null;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  actor: string;
  created_at: string;
  label: string;
}
