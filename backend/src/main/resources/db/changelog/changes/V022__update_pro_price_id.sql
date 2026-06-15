--liquibase formatted sql

--changeset launchly:022
UPDATE plans SET stripe_price_id = 'price_1TiW5tL54jRZdjc4DQJikmVe' WHERE name = 'PRO';
