CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(50) DEFAULT 'TELEGRAM',
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    notes TEXT,
    data JSONB,
    bot_id BIGINT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    bot_user_id BIGINT NOT NULL REFERENCES bot_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_bot_id ON leads(bot_id);
CREATE INDEX idx_leads_bot_user_id ON leads(bot_user_id);
