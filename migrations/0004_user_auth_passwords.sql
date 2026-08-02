-- 0004_user_auth_passwords.sql

-- Create unique index on username if not exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
