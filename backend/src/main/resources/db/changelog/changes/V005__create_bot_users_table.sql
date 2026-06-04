--liquibase formatted sql

--changeset launchly:005
CREATE TABLE bot_users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    current_node_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_bot_users_telegram_bot ON bot_users(telegram_id, bot_id);
CREATE INDEX idx_bot_users_bot_id ON bot_users(bot_id);

