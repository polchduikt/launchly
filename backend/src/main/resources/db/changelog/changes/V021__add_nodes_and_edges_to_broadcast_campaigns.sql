--liquibase formatted sql

--changeset launchly:021
ALTER TABLE broadcast_campaigns
ADD COLUMN nodes JSONB NOT NULL DEFAULT '[]',
ADD COLUMN edges JSONB NOT NULL DEFAULT '[]';
