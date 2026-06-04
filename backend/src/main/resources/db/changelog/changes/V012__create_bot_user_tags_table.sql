--liquibase formatted sql

--changeset launchly:012
CREATE TABLE bot_user_tags (
    id BIGSERIAL PRIMARY KEY,
    bot_user_id BIGINT NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bot_user_tag UNIQUE (bot_user_id, tag_id)
);

CREATE INDEX idx_bot_user_tags_bot_user_id ON bot_user_tags(bot_user_id);
CREATE INDEX idx_bot_user_tags_tag_id ON bot_user_tags(tag_id);
