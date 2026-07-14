--liquibase formatted sql

--changeset launchly:030
ALTER TABLE users ADD COLUMN telegram_name VARCHAR(255);
ALTER TABLE users ADD COLUMN telegram_photo_url VARCHAR(500);
ALTER TABLE users ADD COLUMN notify_email BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN notify_telegram BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN notification_email VARCHAR(255);

ALTER TABLE telegram_auth_sessions ADD COLUMN telegram_name VARCHAR(255);
ALTER TABLE telegram_auth_sessions ADD COLUMN telegram_photo_url VARCHAR(500);
ALTER TABLE telegram_auth_sessions ADD COLUMN is_subscription BOOLEAN DEFAULT FALSE;
