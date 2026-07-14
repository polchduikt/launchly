-- liquibase formatted sql
-- changeset illia:31

ALTER TABLE users ADD COLUMN stats_notifications_enabled BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN stats_day_of_week VARCHAR(50) DEFAULT 'SATURDAY';
ALTER TABLE users ADD COLUMN stats_hour INT DEFAULT 10;
ALTER TABLE users ADD COLUMN stats_days_range INT DEFAULT 5;
ALTER TABLE users ADD COLUMN stats_notify_email BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE users ADD COLUMN stats_notify_telegram BOOLEAN DEFAULT FALSE NOT NULL;
