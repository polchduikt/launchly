--liquibase formatted sql

--changeset launchly:023-1
ALTER TABLE messages ADD COLUMN media_url TEXT;

--changeset launchly:023-2
ALTER TABLE messages ADD COLUMN media_type VARCHAR(20);

--changeset launchly:023-3
ALTER TABLE bot_users ADD COLUMN photo_url VARCHAR(512);
