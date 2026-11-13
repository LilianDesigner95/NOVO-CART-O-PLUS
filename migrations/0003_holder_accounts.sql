CREATE TABLE IF NOT EXISTS holder_accounts (id TEXT PRIMARY KEY, owner TEXT NOT NULL, person_id TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, password_iterations INTEGER NOT NULL, created_at TEXT NOT NULL, disabled_at TEXT, UNIQUE(owner,person_id));
CREATE TABLE IF NOT EXISTS holder_sessions (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(account_id) REFERENCES holder_accounts(id));
CREATE INDEX IF NOT EXISTS holder_sessions_account ON holder_sessions(account_id);
