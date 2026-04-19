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

CREATE INDEX idx_agreements_buyer ON agreements(buyer_id);
CREATE INDEX idx_agreements_status ON agreements(status);
CREATE INDEX idx_agreements_share_token ON agreements(share_token);
CREATE INDEX idx_audit_agreement ON audit_events(agreement_id);
CREATE INDEX idx_audit_created ON audit_events(created_at);
CREATE INDEX idx_auth_codes_email ON auth_codes(email, code, used, expires_at);
