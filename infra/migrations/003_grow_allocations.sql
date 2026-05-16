CREATE TABLE IF NOT EXISTS grow_allocations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'allocated' CHECK (status IN ('allocated', 'withdrawing', 'closed')),
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_at TEXT,
  final_yield_amount REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_grow_allocations_user ON grow_allocations(user_id, status);
