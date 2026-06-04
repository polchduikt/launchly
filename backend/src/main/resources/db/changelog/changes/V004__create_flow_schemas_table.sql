--liquibase formatted sql

--changeset launchly:004
CREATE TABLE flow_schemas (
    id BIGSERIAL PRIMARY KEY,
    version INTEGER NOT NULL DEFAULT 1,
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    bot_id BIGINT NOT NULL UNIQUE REFERENCES bots(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flow_schemas_bot_id ON flow_schemas(bot_id);

