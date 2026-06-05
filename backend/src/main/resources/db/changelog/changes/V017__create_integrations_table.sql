--liquibase formatted sql

--changeset launchly:017
CREATE TABLE integrations (
    id                      BIGSERIAL PRIMARY KEY,
    name                    VARCHAR(255) NOT NULL,
    type                    VARCHAR(50) NOT NULL,
    is_active               BOOLEAN NOT NULL DEFAULT true,
    config                  JSONB,
    google_access_token     TEXT,
    google_refresh_token    TEXT,
    google_token_expires_at TIMESTAMP,
    bot_id                  BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    created_at              TIMESTAMP NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_integrations_bot_id ON integrations(bot_id);
