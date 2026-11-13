CREATE TABLE IF NOT EXISTS admin_accounts (email TEXT PRIMARY KEY, password_salt TEXT NOT NULL, password_hash TEXT NOT NULL, password_iterations INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(email) REFERENCES admin_accounts(email));
CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);
