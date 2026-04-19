import { Agreement, AuditEvent } from "./types";

export const SEED_AGREEMENTS: Agreement[] = [
  {
    id: "agr_01",
    state: "COMPLETED",
    counterparty: "Kwame Asante",
    counterparty_role: "supplier",
    item: "Organic Shea Butter (Grade A)",
    sku: "SHB-001",
    quantity: 500,
    price: 12.4,
    currency: "USD",
    total: 6200,
    delivery_window: { start: "2026-03-01", end: "2026-03-15" },
    payment_rule: "Release on confirmed delivery",
    created_at: "2026-02-18T09:14:00Z",
    buyer: { name: "You", email: "demo@proofprocure.com" },
    supplier: { name: "Kwame Asante", email: "kwame@asanteexports.com" },
    buyer_ratified_at: "2026-02-19T11:00:00Z",
    supplier_ratified_at: "2026-02-19T14:30:00Z",
  },
  {
    id: "agr_02",
    state: "FUNDED",
    counterparty: "Mei Lin Trading Co.",
    counterparty_role: "supplier",
    item: "Stainless Steel Fasteners (M8x40)",
    sku: "SSF-M840",
    quantity: 10000,
    price: 0.18,
    currency: "USD",
    total: 1800,
    delivery_window: { start: "2026-04-20", end: "2026-05-05" },
    payment_rule: "Release on confirmed delivery",
    created_at: "2026-04-10T06:22:00Z",
    buyer: { name: "You", email: "demo@proofprocure.com" },
    supplier: { name: "Mei Lin", email: "mei@meilintrading.cn" },
    buyer_ratified_at: "2026-04-11T08:00:00Z",
    supplier_ratified_at: "2026-04-11T10:15:00Z",
  },
  {
    id: "agr_03",
    state: "RATIFIED",
    counterparty: "Priya Sharma Textiles",
    counterparty_role: "supplier",
    item: "Cotton Fabric Roll (60\" width, white)",
    quantity: 200,
    price: 8.5,
    currency: "USD",
    total: 1700,
    delivery_window: { start: "2026-05-01", end: "2026-05-20" },
    payment_rule: "Release on confirmed delivery",
    created_at: "2026-04-15T13:45:00Z",
    buyer: { name: "You", email: "demo@proofprocure.com" },
    supplier: { name: "Priya Sharma", email: "priya@sharmatextiles.in" },
    buyer_ratified_at: "2026-04-16T09:00:00Z",
    supplier_ratified_at: null,
  },
  {
    id: "agr_04",
    state: "DRAFT",
    counterparty: "Carlos Mendez",
    counterparty_role: "supplier",
    item: "Arabica Coffee Beans (Washed, SHG)",
    quantity: 300,
    price: 5.2,
    currency: "USD",
    total: 1560,
    delivery_window: { start: "2026-05-10", end: "2026-05-25" },
    payment_rule: "Release on confirmed delivery",
    created_at: "2026-04-18T16:30:00Z",
    buyer: { name: "You", email: "demo@proofprocure.com" },
    supplier: { name: "Carlos Mendez", email: "carlos@mendezfinca.co" },
    buyer_ratified_at: null,
    supplier_ratified_at: null,
  },
  {
    id: "agr_05",
    state: "DELIVERED_PENDING_CONFIRMATION",
    counterparty: "Fatima Al-Rashid",
    counterparty_role: "supplier",
    item: "Saffron Threads (Grade I, Iranian)",
    quantity: 5,
    price: 480,
    currency: "USD",
    total: 2400,
    delivery_window: { start: "2026-04-01", end: "2026-04-12" },
    payment_rule: "Release on confirmed delivery",
    created_at: "2026-03-20T10:00:00Z",
    buyer: { name: "You", email: "demo@proofprocure.com" },
    supplier: { name: "Fatima Al-Rashid", email: "fatima@rashidspices.ir" },
    buyer_ratified_at: "2026-03-21T07:00:00Z",
    supplier_ratified_at: "2026-03-21T12:00:00Z",
  },
];

export function getAuditTimeline(agreement: Agreement): AuditEvent[] {
  const events: AuditEvent[] = [
    {
      id: "ev_1",
      event_type: "CONVERSATION_RECEIVED",
      actor: "system",
      created_at: agreement.created_at,
      label: "Conversation received",
    },
    {
      id: "ev_2",
      event_type: "TERMS_EXTRACTED",
      actor: "system",
      created_at: new Date(new Date(agreement.created_at).getTime() + 30000).toISOString(),
      label: "Terms extracted from conversation",
    },
  ];

  if (agreement.buyer_ratified_at) {
    events.push({
      id: "ev_3",
      event_type: "BUYER_CONFIRMED",
      actor: agreement.buyer.name,
      created_at: agreement.buyer_ratified_at,
      label: "Buyer confirmed agreement",
    });
  }

  if (agreement.supplier_ratified_at) {
    events.push({
      id: "ev_4",
      event_type: "SUPPLIER_RATIFIED",
      actor: agreement.supplier.name,
      created_at: agreement.supplier_ratified_at,
      label: "Supplier ratified agreement",
    });
  }

  if (["FUNDED", "DELIVERED_PENDING_CONFIRMATION", "COMPLETED"].includes(agreement.state)) {
    events.push({
      id: "ev_5",
      event_type: "AGREEMENT_FUNDED",
      actor: agreement.buyer.name,
      created_at: new Date(new Date(agreement.supplier_ratified_at || agreement.created_at).getTime() + 86400000).toISOString(),
      label: "Agreement funded",
    });
  }

  if (["DELIVERED_PENDING_CONFIRMATION", "COMPLETED"].includes(agreement.state)) {
    events.push({
      id: "ev_6",
      event_type: "DELIVERY_MARKED",
      actor: agreement.supplier.name,
      created_at: new Date(new Date(agreement.delivery_window.end).getTime()).toISOString(),
      label: "Delivery marked by supplier",
    });
  }

  if (agreement.state === "COMPLETED") {
    events.push({
      id: "ev_7",
      event_type: "PAYMENT_RELEASED",
      actor: "system",
      created_at: new Date(new Date(agreement.delivery_window.end).getTime() + 86400000).toISOString(),
      label: "Payment released",
    });
  }

  return events;
}
