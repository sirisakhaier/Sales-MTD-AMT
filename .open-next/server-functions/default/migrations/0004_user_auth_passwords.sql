-- 0004_user_auth_passwords.sql

ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Create unique index on username if not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
