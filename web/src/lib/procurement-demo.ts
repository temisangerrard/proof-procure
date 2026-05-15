import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  type LucideIcon,
  ShieldCheck,
} from "lucide-react";

export type ReadinessState = "ready" | "short" | "due-soon" | "paid";

export interface Supplier {
  id: string;
  name: string;
  country: string;
  currency: string;
  terms: string;
  averageInvoice: number;
  notes: string;
}

export interface Obligation {
  id: string;
  supplierId: string;
  title: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: ReadinessState;
  reserved: number;
  priority: "Low" | "Normal" | "High";
  source: "Manual" | "Invoice upload" | "Captured terms";
}

export interface Reserve {
  id: string;
  label: string;
  supplierId?: string;
  category: "Supplier" | "Freight" | "Inventory" | "Customs";
  amount: number;
  currency: string;
  status: "Active" | "Applied";
}

export const procurementAccount = {
  availableBalance: 48200,
  reservedBalance: 31200,
  availableToAllocate: 17000,
  upcomingObligations: 38100,
  dueThisWeek: 14700,
  readinessPercent: 82,
  fundingGap: 6900,
};

export const suppliers: Supplier[] = [
  {
    id: "sup_mei",
    name: "Mei Lin Trading Co.",
    country: "China",
    currency: "USD",
    terms: "30% before shipment, balance on delivery",
    averageInvoice: 18000,
    notes: "Hardware supplier. Usually ships within 12 days.",
  },
  {
    id: "sup_ankara",
    name: "Ankara Textile Works",
    country: "Turkey",
    currency: "EUR",
    terms: "Pay before dispatch",
    averageInvoice: 12600,
    notes: "Fabric orders for seasonal inventory.",
  },
  {
    id: "sup_sai",
    name: "Sai Components",
    country: "India",
    currency: "USD",
    terms: "Due 7 days after invoice",
    averageInvoice: 7200,
    notes: "Packaging and small replacement parts.",
  },
  {
    id: "sup_viet",
    name: "Viet Freight Partners",
    country: "Vietnam",
    currency: "USD",
    terms: "Freight deposit before release",
    averageInvoice: 4900,
    notes: "Freight and port release costs.",
  },
];

export const obligations: Obligation[] = [
  {
    id: "obl_01",
    supplierId: "sup_mei",
    title: "Fasteners shipment balance",
    amount: 18200,
    currency: "USD",
    dueDate: "2026-05-19",
    status: "ready",
    reserved: 18200,
    priority: "High",
    source: "Captured terms",
  },
  {
    id: "obl_02",
    supplierId: "sup_ankara",
    title: "Cotton fabric invoice",
    amount: 12400,
    currency: "EUR",
    dueDate: "2026-05-21",
    status: "short",
    reserved: 7600,
    priority: "High",
    source: "Invoice upload",
  },
  {
    id: "obl_03",
    supplierId: "sup_viet",
    title: "Freight reserve for container",
    amount: 5200,
    currency: "USD",
    dueDate: "2026-05-17",
    status: "due-soon",
    reserved: 3400,
    priority: "Normal",
    source: "Manual",
  },
  {
    id: "obl_04",
    supplierId: "sup_sai",
    title: "Packaging parts order",
    amount: 2300,
    currency: "USD",
    dueDate: "2026-05-28",
    status: "paid",
    reserved: 2300,
    priority: "Low",
    source: "Captured terms",
  },
];

export const reserves: Reserve[] = [
  {
    id: "res_01",
    label: "Mei Lin shipment balance",
    supplierId: "sup_mei",
    category: "Supplier",
    amount: 18200,
    currency: "USD",
    status: "Active",
  },
  {
    id: "res_02",
    label: "Turkey fabric order",
    supplierId: "sup_ankara",
    category: "Inventory",
    amount: 7600,
    currency: "EUR",
    status: "Active",
  },
  {
    id: "res_03",
    label: "Vietnam freight release",
    supplierId: "sup_viet",
    category: "Freight",
    amount: 3400,
    currency: "USD",
    status: "Active",
  },
  {
    id: "res_04",
    label: "Packaging parts paid",
    supplierId: "sup_sai",
    category: "Inventory",
    amount: 2300,
    currency: "USD",
    status: "Applied",
  },
];

export const readinessStyles: Record<
  ReadinessState,
  {
    label: string;
    icon: LucideIcon;
    className: string;
    dot: string;
    plain: string;
  }
> = {
  ready: {
    label: "Ready",
    icon: ShieldCheck,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    plain: "Money is set aside",
  },
  short: {
    label: "Short",
    icon: AlertTriangle,
    className: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    plain: "Needs more money",
  },
  "due-soon": {
    label: "Due soon",
    icon: Clock3,
    className: "bg-amber-50 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
    plain: "Pay date is close",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    className: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
    plain: "Finished",
  },
};

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getSupplier(id: string) {
  return suppliers.find((supplier) => supplier.id === id);
}

export function getObligationsForSupplier(supplierId: string) {
  return obligations.filter((obligation) => obligation.supplierId === supplierId);
}
