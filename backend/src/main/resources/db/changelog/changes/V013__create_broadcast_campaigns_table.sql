--liquibase formatted sql

--changeset launchly:013
CREATE TABLE broadcast_campaigns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    filter_type VARCHAR(20) NOT NULL DEFAULT 'ALL',
    filter_value VARCHAR(255),
    scheduled_at TIMESTAMP,
    sent_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    total_count INT NOT NULL DEFAULT 0,
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_broadcast_campaigns_bot_id ON broadcast_campaigns(bot_id);
CREATE INDEX idx_broadcast_campaigns_status ON broadcast_campaigns(status);
