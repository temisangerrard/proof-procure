import { nanoid } from "nanoid";
import { d1 } from "./db";
import { getOrCreateEmbeddedWallet } from "./circle-wallet";
import { createArcPaymentReference } from "./arc";
import type { SessionUser } from "./auth";

export interface BusinessRecord {
  id: string;
  user_id: string;
  name: string;
  country: string;
  main_currency: string;
  supplier_countries: string;
}

export interface SupplierRecord {
  id: string;
  user_id: string;
  name: string;
  country: string;
  currency: string;
  phone?: string;
  email?: string;
  payout_note?: string;
  status: string;
}

export interface BillRecord {
  id: string;
  user_id: string;
  supplier_id: string;
  supplier_name?: string;
  title: string;
  amount: number;
  currency: string;
  due_date: string;
  status: "draft" | "ready" | "short" | "sent" | "paid" | "failed";
  reserved_amount: number;
  priority: string;
  source: string;
  note?: string;
  paid_at?: string;
}

export interface WalletRecord {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id?: string;
  provider_wallet_id?: string;
  address?: string;
  chain: string;
  currency: string;
  status: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  bill_id: string;
  supplier_id: string;
  wallet_id?: string;
  amount: number;
  currency: string;
  status: "draft" | "confirming" | "sent" | "paid" | "failed";
  chain: string;
  tx_hash?: string;
  reference?: string;
}

interface LocalState {
  businesses: BusinessRecord[];
  suppliers: SupplierRecord[];
  bills: BillRecord[];
  wallets: WalletRecord[];
  payments: PaymentRecord[];
}

const globalStore = globalThis as typeof globalThis & {
  __proofProcureStore?: LocalState;
};

function localState(): LocalState {
  if (!globalStore.__proofProcureStore) {
    globalStore.__proofProcureStore = {
      businesses: [],
      suppliers: [],
      bills: [],
      wallets: [],
      payments: [],
    };
  }

  return globalStore.__proofProcureStore;
}

function canUseLocalFallback() {
  return process.env.NODE_ENV !== "production";
}

async function withD1<T>(
  operation: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!canUseLocalFallback()) {
      throw error;
    }
    return fallback();
  }
}

export async function saveOnboarding(
  user: SessionUser,
  input: {
    businessName: string;
    country: string;
    industryType: string;
    tradeCorridors: string[];
    productCategories: string[];
    dealSize: string;
    mainCurrency: string;
    supplierCount: string;
    paymentMethod: string;
  },
) {
  const tradeCorridorsJson = JSON.stringify(input.tradeCorridors);
  const profileJson = JSON.stringify({
    industryType: input.industryType,
    productCategories: input.productCategories,
    dealSize: input.dealSize,
    supplierCount: input.supplierCount,
    paymentMethod: input.paymentMethod,
  });

  await withD1(
    async () => {
      const id = nanoid();
      await d1.run(
        `INSERT INTO businesses (id, user_id, name, country, main_currency, supplier_countries, industry_type, product_categories, deal_size, supplier_count, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          user.id,
          input.businessName || "My business",
          input.country || "",
          input.mainCurrency || "USD",
          tradeCorridorsJson,
          input.industryType || "",
          JSON.stringify(input.productCategories),
          input.dealSize || "",
          input.supplierCount || "",
          input.paymentMethod || "",
        ],
      );
      return true;
    },
    () => {
      localState().businesses.push({
        id: nanoid(),
        user_id: user.id,
        name: input.businessName || "My business",
        country: input.country || "",
        main_currency: input.mainCurrency || "USD",
        supplier_countries: tradeCorridorsJson,
      });
      return true;
    },
  );

  return { profile: profileJson };
}

export async function listSuppliers(user: SessionUser) {
  return withD1(
    async () => {
      const rows = await d1.query<SupplierRecord>(
        "SELECT * FROM suppliers WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC",
        [user.id],
      );
      return rows.results;
    },
    () =>
      localState().suppliers.filter((supplier) => supplier.user_id === user.id),
  );
}

export async function createSupplier(
  user: SessionUser,
  input: {
    name: string;
    country?: string;
    currency?: string;
    phone?: string;
    email?: string;
  },
) {
  const supplier: SupplierRecord = {
    id: nanoid(),
    user_id: user.id,
    name: input.name,
    country: input.country || "",
    currency: input.currency || "USD",
    phone: input.phone || "",
    email: input.email || "",
    status: "active",
  };

  return withD1(
    async () => {
      await d1.run(
        `INSERT INTO suppliers (id, user_id, name, country, currency, phone, email, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          supplier.id,
          user.id,
          supplier.name,
          supplier.country,
          supplier.currency,
          supplier.phone,
          supplier.email,
          supplier.status,
        ],
      );
      return supplier;
    },
    () => {
      localState().suppliers.unshift(supplier);
      return supplier;
    },
  );
}

export async function listBills(user: SessionUser) {
  return withD1(
    async () => {
      const rows = await d1.query<BillRecord>(
        `SELECT bills.*, suppliers.name as supplier_name
         FROM bills
         LEFT JOIN suppliers ON suppliers.id = bills.supplier_id
         WHERE bills.user_id = ?
         ORDER BY bills.created_at DESC`,
        [user.id],
      );
      return rows.results;
    },
    () => localState().bills.filter((bill) => bill.user_id === user.id),
  );
}

export async function createBill(
  user: SessionUser,
  input: {
    supplierId: string;
    title?: string;
    amount: number;
    currency?: string;
    dueDate?: string;
    note?: string;
  },
) {
  const status = input.amount > 0 ? "short" : "draft";
  const bill: BillRecord = {
    id: nanoid(),
    user_id: user.id,
    supplier_id: input.supplierId,
    title: input.title || "Supplier payment",
    amount: input.amount,
    currency: input.currency || "USD",
    due_date: input.dueDate || "",
    status,
    reserved_amount: 0,
    priority: "normal",
    source: "manual",
    note: input.note || "",
  };

  return withD1(
    async () => {
      await d1.run(
        `INSERT INTO bills (id, user_id, supplier_id, title, amount, currency, due_date, status, reserved_amount, priority, source, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bill.id,
          user.id,
          bill.supplier_id,
          bill.title,
          bill.amount,
          bill.currency,
          bill.due_date,
          bill.status,
          bill.reserved_amount,
          bill.priority,
          bill.source,
          bill.note,
        ],
      );
      return bill;
    },
    () => {
      const supplier = localState().suppliers.find(
        (item) => item.id === bill.supplier_id,
      );
      localState().bills.unshift({ ...bill, supplier_name: supplier?.name });
      return bill;
    },
  );
}

export async function getOrCreateWallet(user: SessionUser) {
  const existing = await withD1(
    async () =>
      d1.first<WalletRecord>(
        "SELECT * FROM wallets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [user.id],
      ),
    () =>
      localState().wallets.find((wallet) => wallet.user_id === user.id) || null,
  );
  if (existing) return existing;

  const embedded = await getOrCreateEmbeddedWallet(user.email);
  const wallet: WalletRecord = {
    id: nanoid(),
    user_id: user.id,
    provider: embedded.provider,
    provider_user_id: embedded.providerUserId,
    provider_wallet_id: embedded.providerWalletId,
    address: embedded.address,
    chain: embedded.chain,
    currency: "USD",
    status: embedded.status,
  };

  return withD1(
    async () => {
      await d1.run(
        `INSERT INTO wallets (id, user_id, provider, provider_user_id, provider_wallet_id, address, chain, currency, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wallet.id,
          user.id,
          wallet.provider,
          wallet.provider_user_id,
          wallet.provider_wallet_id,
          wallet.address || "",
          wallet.chain,
          wallet.currency,
          wallet.status,
        ],
      );
      return wallet;
    },
    () => {
      localState().wallets.push(wallet);
      return wallet;
    },
  );
}

export async function recordCircleWallet(
  user: SessionUser,
  input: {
    providerUserId?: string;
    providerWalletId: string;
    address: string;
    chain: string;
    status?: string;
  },
) {
  const wallet: WalletRecord = {
    id: nanoid(),
    user_id: user.id,
    provider: "circle",
    provider_user_id: input.providerUserId || "",
    provider_wallet_id: input.providerWalletId,
    address: input.address,
    chain: input.chain.toLowerCase(),
    currency: "USD",
    status: input.status || "ready",
  };

  return withD1(
    async () => {
      const existing = await d1.first<WalletRecord>(
        "SELECT * FROM wallets WHERE user_id = ? AND provider_wallet_id = ? LIMIT 1",
        [user.id, input.providerWalletId],
      );
      if (existing) return existing;

      await d1.run(
        `INSERT INTO wallets (id, user_id, provider, provider_user_id, provider_wallet_id, address, chain, currency, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wallet.id,
          user.id,
          wallet.provider,
          wallet.provider_user_id,
          wallet.provider_wallet_id,
          wallet.address,
          wallet.chain,
          wallet.currency,
          wallet.status,
        ],
      );
      return wallet;
    },
    () => {
      const existing = localState().wallets.find(
        (item) =>
          item.user_id === user.id &&
          item.provider_wallet_id === input.providerWalletId,
      );
      if (existing) return existing;
      localState().wallets.push(wallet);
      return wallet;
    },
  );
}

export async function payBill(user: SessionUser, billId: string) {
  const bills = await listBills(user);
  const bill = bills.find((item) => item.id === billId);
  if (!bill) throw new Error("Bill not found");
  if (bill.status === "paid") {
    const existing = await withD1(
      async () =>
        d1.first<PaymentRecord>(
          "SELECT * FROM payments WHERE user_id = ? AND bill_id = ? ORDER BY created_at DESC LIMIT 1",
          [user.id, bill.id],
        ),
      () =>
        localState().payments.find(
          (item) => item.user_id === user.id && item.bill_id === bill.id,
        ) || null,
    );
    if (existing) return existing;
    throw new Error("Bill is already paid");
  }
  if (bill.status !== "ready" && bill.status !== "short") {
    throw new Error("Bill is not ready to pay");
  }

  const existingPayment = await withD1(
    async () =>
      d1.first<PaymentRecord>(
        "SELECT * FROM payments WHERE user_id = ? AND bill_id = ? AND status IN ('confirming', 'sent', 'paid') ORDER BY created_at DESC LIMIT 1",
        [user.id, bill.id],
      ),
    () =>
      localState().payments.find(
        (item) =>
          item.user_id === user.id &&
          item.bill_id === bill.id &&
          ["confirming", "sent", "paid"].includes(item.status),
      ) || null,
  );
  if (existingPayment) return existingPayment;

  const wallet = await getOrCreateWallet(user);
  const arc = await createArcPaymentReference();
  const payment: PaymentRecord = {
    id: nanoid(),
    user_id: user.id,
    bill_id: bill.id,
    supplier_id: bill.supplier_id,
    wallet_id: wallet.id,
    amount: bill.amount,
    currency: bill.currency,
    status: "confirming",
    chain: wallet.chain,
    tx_hash: arc.txHash,
    reference: arc.reference,
  };

  return withD1(
    async () => {
      await d1.batch([
        {
          sql: `INSERT INTO payments (id, user_id, bill_id, supplier_id, wallet_id, amount, currency, status, chain, tx_hash, reference)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: [
            payment.id,
            user.id,
            payment.bill_id,
            payment.supplier_id,
            payment.wallet_id,
            payment.amount,
            payment.currency,
            payment.status,
            payment.chain,
            payment.tx_hash,
            payment.reference,
          ],
        },
        {
          sql: "UPDATE bills SET status = 'sent', updated_at = datetime('now') WHERE id = ? AND user_id = ?",
          params: [bill.id, user.id],
        },
      ]);
      return payment;
    },
    () => {
      localState().payments.unshift(payment);
      const localBill = localState().bills.find(
        (item) => item.id === bill.id && item.user_id === user.id,
      );
      if (localBill) {
        localBill.status = "sent";
      }
      return payment;
    },
  );
}

export async function markPaymentPaid(
  user: SessionUser,
  input: { paymentId: string; txHash: string },
) {
  if (!input.paymentId || !input.txHash) {
    throw new Error("Payment and transaction reference required");
  }

  const payment = await withD1(
    async () =>
      d1.first<PaymentRecord>(
        "SELECT * FROM payments WHERE id = ? AND user_id = ? LIMIT 1",
        [input.paymentId, user.id],
      ),
    () =>
      localState().payments.find(
        (item) => item.id === input.paymentId && item.user_id === user.id,
      ) || null,
  );

  if (!payment) throw new Error("Payment not found");

  return withD1(
    async () => {
      await d1.batch([
        {
          sql: "UPDATE payments SET status = 'paid', tx_hash = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
          params: [input.txHash, payment.id, user.id],
        },
        {
          sql: "UPDATE bills SET status = 'paid', paid_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?",
          params: [payment.bill_id, user.id],
        },
      ]);
      return { ...payment, status: "paid" as const, tx_hash: input.txHash };
    },
    () => {
      payment.status = "paid";
      payment.tx_hash = input.txHash;
      const localBill = localState().bills.find(
        (item) => item.id === payment.bill_id && item.user_id === user.id,
      );
      if (localBill) {
        localBill.status = "paid";
        localBill.paid_at = new Date().toISOString();
      }
      return payment;
    },
  );
}
