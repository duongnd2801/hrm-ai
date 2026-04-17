-- V30__create_audit_logs.sql

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50),
    target_id VARCHAR(100),
    old_values TEXT, -- JSON content string
    new_values TEXT, -- JSON content string
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookup
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(target_table);
CREATE INDEX idx_audit_action ON audit_logs(action);
