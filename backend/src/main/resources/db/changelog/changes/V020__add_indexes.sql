--liquibase formatted sql

--changeset launchly:020
-- bots
CREATE INDEX idx_bots_active ON bots(is_active);

-- bot_users
CREATE INDEX idx_bot_users_telegram_id ON bot_users(telegram_id);
CREATE INDEX idx_bot_users_bot_telegram ON bot_users(bot_id, telegram_id);

-- orders
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_bot_status ON orders(bot_id, status);

-- leads
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- conversations
CREATE INDEX idx_conversations_bot_user_id ON conversations(bot_user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- messages
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);

-- broadcast_campaigns
CREATE INDEX idx_broadcast_scheduled ON broadcast_campaigns(status, scheduled_at)
    WHERE status = 'SCHEDULED';

-- subscriptions
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- integrations
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_active ON integrations(bot_id, is_active);
