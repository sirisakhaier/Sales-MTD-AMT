-- 0002_add_audit_logs.sql

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    action TEXT,
    entity_type TEXT,
    entity_id TEXT,
    description TEXT,
    created_at TEXT
);
