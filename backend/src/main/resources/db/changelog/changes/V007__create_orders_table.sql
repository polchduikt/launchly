--liquibase formatted sql

--changeset launchly:007
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    total_amount DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'UAH',
    notes TEXT,
    items JSONB,
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    bot_user_id BIGINT NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_bot_id ON orders(bot_id);
CREATE INDEX idx_orders_bot_user_id ON orders(bot_user_id);
