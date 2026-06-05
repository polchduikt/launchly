--liquibase formatted sql

--changeset launchly:014
CREATE TABLE plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    max_bots INT NOT NULL,
    max_bot_users INT NOT NULL,
    max_broadcasts_per_month INT NOT NULL,
    can_use_broadcast BOOLEAN NOT NULL DEFAULT FALSE,
    can_use_integrations BOOLEAN NOT NULL DEFAULT FALSE,
    can_use_ai_agent BOOLEAN NOT NULL DEFAULT FALSE,
    can_use_payments BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_price_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
