--liquibase formatted sql

--changeset launchly:025
UPDATE plans SET max_bot_users = 10 WHERE name = 'FREE';
UPDATE plans SET max_bot_users = 300, max_bots = 2 WHERE name = 'STARTER';
UPDATE plans SET max_bot_users = 1500, price = 20.00, max_bots = 4 WHERE name = 'PRO';
UPDATE plans SET name = 'BUSINESS', display_name = 'Business', max_bot_users = 15000 WHERE name = 'UNLIMITED';
