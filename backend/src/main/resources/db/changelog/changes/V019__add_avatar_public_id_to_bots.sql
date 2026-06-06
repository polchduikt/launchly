--liquibase formatted sql

--changeset launchly:019
ALTER TABLE bots ADD COLUMN avatar_public_id VARCHAR(255);
