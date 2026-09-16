-- V065: Add captcha columns to bot_moderation_rules table

ALTER TABLE bot_moderation_rules
    ADD COLUMN IF NOT EXISTS captcha_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS captcha_mode VARCHAR(32) NOT NULL DEFAULT 'BUTTON',
    ADD COLUMN IF NOT EXISTS captcha_timeout_seconds INTEGER NOT NULL DEFAULT 60,
    ADD COLUMN IF NOT EXISTS captcha_message_template TEXT;
