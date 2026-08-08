--liquibase formatted sql
--changeset launchly:047-add-template-name-to-broadcast-campaigns

ALTER TABLE broadcast_campaigns ADD COLUMN IF NOT EXISTS template_name VARCHAR(500);
