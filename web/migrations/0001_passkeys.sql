CREATE TABLE IF NOT EXISTS passkey_credentials (
  credential_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  device_type TEXT,
  backed_up INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS passkey_challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  used INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user ON passkey_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_email ON passkey_challenges(email, type, used, expires_at);
