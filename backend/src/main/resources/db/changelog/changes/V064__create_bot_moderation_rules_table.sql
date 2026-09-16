-- V064: Create bot moderation rules table

CREATE TABLE IF NOT EXISTS bot_moderation_rules (
    id BIGSERIAL PRIMARY KEY,
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    chat_id VARCHAR(128) NOT NULL DEFAULT '*',
    thread_id INTEGER,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    anti_forward_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    anti_link_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_links TEXT,
    stop_words TEXT,
    default_profanity_filter BOOLEAN NOT NULL DEFAULT TRUE,
    media_mode VARCHAR(32) NOT NULL DEFAULT 'ALL',
    action_on_violation VARCHAR(32) NOT NULL DEFAULT 'DELETE_AND_WARN',
    warning_template TEXT,
    warn_ttl_seconds INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bmr_bot_chat ON bot_moderation_rules(bot_id, chat_id);
CREATE INDEX IF NOT EXISTS idx_bmr_bot_enabled ON bot_moderation_rules(bot_id, enabled);
