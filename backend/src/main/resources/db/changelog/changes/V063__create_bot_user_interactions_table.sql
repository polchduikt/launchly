-- V063: Create bot user interactions table

CREATE TABLE IF NOT EXISTS bot_user_interactions (
    id BIGSERIAL PRIMARY KEY,
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    source_telegram_id BIGINT NOT NULL,
    target_telegram_id BIGINT NOT NULL,
    interaction_type VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bui_bot_src_type ON bot_user_interactions(bot_id, source_telegram_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_bui_bot_tgt_type ON bot_user_interactions(bot_id, target_telegram_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_bui_bot_src_tgt ON bot_user_interactions(bot_id, source_telegram_id, target_telegram_id);
