--liquibase formatted sql

--changeset launchly:011
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tags_bot_name UNIQUE (bot_id, name)
);

CREATE INDEX idx_tags_bot_id ON tags(bot_id);
