--liquibase formatted sql

--changeset launchly:026
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    bot_user_id BIGINT NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_events_bot ON analytics_events(bot_id);
CREATE INDEX idx_analytics_events_bot_user ON analytics_events(bot_user_id);
CREATE INDEX idx_analytics_events_type_created ON analytics_events(event_type, created_at);
