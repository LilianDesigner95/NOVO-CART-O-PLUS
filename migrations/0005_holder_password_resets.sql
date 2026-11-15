CREATE TABLE IF NOT EXISTS holder_password_resets (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT, created_at TEXT NOT NULL, FOREIGN KEY(account_id) REFERENCES holder_accounts(id));
CREATE INDEX IF NOT EXISTS holder_password_resets_account ON holder_password_resets(account_id);
