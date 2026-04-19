ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_channel TEXT NOT NULL DEFAULT 'email'
    CHECK (notification_channel IN ('telegram', 'email'));
