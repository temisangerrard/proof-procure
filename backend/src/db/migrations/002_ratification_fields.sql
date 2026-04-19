ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS buyer_ratification_sig TEXT,
  ADD COLUMN IF NOT EXISTS supplier_ratification_sig TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
