--liquibase formatted sql

--changeset launchly:055
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_updated ON conversations(bot_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_status ON conversations(bot_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_bot_created ON leads(bot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_bot_user_bot ON leads(bot_user_id, bot_id);
CREATE INDEX IF NOT EXISTS idx_orders_bot_created ON orders(bot_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bot_members_user_bot ON bot_members(user_id, bot_id);
CREATE INDEX IF NOT EXISTS idx_bots_user_updated ON bots(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_templates_creator_created ON account_templates(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_installed_templates_user_created ON installed_templates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_installed_templates_bot ON installed_templates(bot_id);
CREATE INDEX IF NOT EXISTS idx_tags_bot_created ON tags(bot_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_invitations_email_accepted ON bot_invitations(email, accepted);

CREATE INDEX IF NOT EXISTS idx_analytics_bot_type_created ON analytics_events(bot_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_users_bot_created ON bot_users(bot_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON user_audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_created ON support_messages(ticket_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_broadcast_bot_status_created ON broadcast_campaigns(bot_id, status, created_at DESC);
