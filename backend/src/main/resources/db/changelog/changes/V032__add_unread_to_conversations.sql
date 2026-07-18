--liquibase formatted sql

--changeset launchly:032
ALTER TABLE conversations ADD COLUMN unread BOOLEAN NOT NULL DEFAULT FALSE;
