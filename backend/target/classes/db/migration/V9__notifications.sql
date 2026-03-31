-- V9__notifications.sql — Notifications table schema

-- NotificationType ENUM
CREATE TYPE notification_type AS ENUM (
    'INFO',
    'SUCCESS',
    'WARNING', 
    'ERROR',
    'REQUEST_PENDING',
    'REQUEST_APPROVED',
    'REQUEST_REJECTED'
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50), -- e.g., "APOLOGY", "LEAVE_REQUEST", "OT_REQUEST"
    related_entity_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
