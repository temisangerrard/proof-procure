CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE agreement_state AS ENUM (
  'DRAFT',
  'PROPOSED',
  'RATIFIED',
  'DEPLOYED',
  'FUNDED',
  'DELIVERED_PENDING_CONFIRMATION',
  'COMPLETED',
  'PAUSED',
  'EXPIRED',
  'REFUNDED',
  'REJECTED'
);

CREATE TYPE user_role AS ENUM ('buyer', 'supplier', 'both');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  telegram_id TEXT UNIQUE,
  privy_did TEXT UNIQUE,
  wallet_address TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id),
  supplier_id UUID REFERENCES users(id),
  raw_input TEXT NOT NULL,
  extracted_data JSONB,
  confidence_score FLOAT,
  state agreement_state NOT NULL DEFAULT 'DRAFT',
  share_token TEXT UNIQUE,
  buyer_ratified_at TIMESTAMPTZ,
  supplier_ratified_at TIMESTAMPTZ,
  contract_address TEXT,
  agreement_hash TEXT,
  confirmation_window INTEGER,
  delivery_deadline TIMESTAMPTZ,
  expiry_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES agreements(id),
  event_type TEXT NOT NULL,
  actor TEXT,
  onchain_tx_hash TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agreements_state ON agreements(state);
CREATE INDEX idx_agreements_share_token ON agreements(share_token);
CREATE INDEX idx_audit_events_agreement ON audit_events(agreement_id);
