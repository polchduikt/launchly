ALTER TABLE messages ADD COLUMN scheduled_at TIMESTAMP;
ALTER TABLE messages ADD COLUMN sent BOOLEAN DEFAULT TRUE;

CREATE INDEX idx_messages_scheduled ON messages(sent, scheduled_at) WHERE sent = FALSE;
