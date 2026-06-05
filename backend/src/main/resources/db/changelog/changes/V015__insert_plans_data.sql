--liquibase formatted sql

--changeset launchly:015
INSERT INTO plans (name, display_name, price, currency, max_bots, max_bot_users, max_broadcasts_per_month, can_use_broadcast, can_use_integrations, can_use_ai_agent, can_use_payments, stripe_price_id) VALUES
('FREE', 'Free', 0.00, 'USD', 1, 100, 0, FALSE, FALSE, FALSE, FALSE, 'price_free'),
('STARTER', 'Starter', 10.00, 'USD', 3, 1000, 5, TRUE, TRUE, FALSE, FALSE, 'price_starter_placeholder'),
('PRO', 'Pro', 25.00, 'USD', 10, 10000, 99999, TRUE, TRUE, TRUE, TRUE, 'price_pro_placeholder'),
('UNLIMITED', 'Unlimited', 99.00, 'USD', 100, 100000, 999999, TRUE, TRUE, TRUE, TRUE, 'price_unlimited_placeholder');
