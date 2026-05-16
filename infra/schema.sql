-- ProofProcure D1 Schema
-- Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  wallet_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agreements (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL REFERENCES users(id),
  supplier_email TEXT NOT NULL,
  supplier_id TEXT REFERENCES users(id),
  item TEXT NOT NULL,
  quantity TEXT NOT NULL,
  price TEXT NOT NULL,
  total TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDC',
  delivery_window TEXT,
  confirmation_type TEXT NOT NULL DEFAULT 'single',
  confirmation_window TEXT,
  payment_condition TEXT NOT NULL DEFAULT 'on_delivery',
  expiry TEXT,
  agreement_hash TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'awaiting_buyer', 'awaiting_supplier', 'ratified',
    'funded', 'delivered', 'confirmed', 'payment_released',
    'rejected', 'expired', 'timed_out'
  )),
  raw_input TEXT,
  confidence REAL,
  contract_address TEXT,
  factory_address TEXT,
  tx_hash TEXT,
  share_token TEXT UNIQUE,
  buyer_ratified_at TEXT,
  supplier_ratified_at TEXT,
  funded_at TEXT,
  delivered_at TEXT,
  confirmed_at TEXT,
  payment_released_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agreement_id TEXT NOT NULL REFERENCES agreements(id),
  event_type TEXT NOT NULL,
  actor_id TEXT REFERENCES users(id),
  actor_email TEXT,
  detail TEXT,
  tx_hash TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'telegram', 'both')),
  telegram_chat_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  country TEXT,
  main_currency TEXT NOT NULL DEFAULT 'USD',
  supplier_countries TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL DEFAULT 'circle',
  provider_user_id TEXT,
  provider_wallet_id TEXT,
  address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'arc-testnet',
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('pending', 'ready', 'blocked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  country TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  phone TEXT,
  email TEXT,
  payout_note TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'short', 'sent', 'paid', 'failed')),
  reserved_amount REAL NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  source TEXT NOT NULL DEFAULT 'manual',
  note TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  bill_id TEXT NOT NULL REFERENCES bills(id),
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  wallet_id TEXT REFERENCES wallets(id),
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirming', 'sent', 'paid', 'failed')),
  chain TEXT NOT NULL DEFAULT 'arc-testnet',
  tx_hash TEXT,
  reference TEXT,
  failure_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wallet_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  wallet_id TEXT REFERENCES wallets(id),
  event_type TEXT NOT NULL,
  amount REAL,
  currency TEXT,
  tx_hash TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agreements_buyer ON agreements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_share_token ON agreements(share_token);
CREATE INDEX IF NOT EXISTS idx_audit_agreement ON audit_events(agreement_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_codes_email ON auth_codes(email, code, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_businesses_user ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_status ON bills(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_supplier ON bills(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_wallet_events_user ON wallet_events(user_id, created_at);
