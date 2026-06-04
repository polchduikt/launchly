CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    bot_user_id BIGINT NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_bot_id ON conversations(bot_id);
CREATE UNIQUE INDEX idx_conversations_bot_id_bot_user_id ON conversations(bot_id, bot_user_id);
